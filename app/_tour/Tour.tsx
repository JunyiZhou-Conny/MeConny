"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import * as THREE from "three";
import { DecalGeometry } from "three/examples/jsm/geometries/DecalGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { tour, type Sticker, type TourStop, type Vec3 } from "@/content/tour";
import { groundShadow } from "./clay";
import { buildWorkstation } from "./workstation";

type Mode = "static" | "loading" | "live";

type Placement = Pick<Sticker, "position" | "normal" | "size" | "rotation">;

const stops: readonly TourStop[] = tour.stops;
const last = stops.length - 1;
const { clamp, lerp, degToRad } = THREE.MathUtils;

const vec = (v: Vec3) => new THREE.Vector3(v[0], v[1], v[2]);

const round3 = (v: THREE.Vector3): Vec3 => [
  Number(v.x.toFixed(3)),
  Number(v.y.toFixed(3)),
  Number(v.z.toFixed(3)),
];

function flatTexture(url: string, renderer: THREE.WebGLRenderer) {
  const map = new THREE.TextureLoader().load(url);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return map;
}

function makeDecal(mesh: THREE.Mesh, placement: Placement, map: THREE.Texture) {
  const position = vec(placement.position);
  const normal = vec(placement.normal).normalize();
  const helper = new THREE.Object3D();
  helper.position.copy(position);
  helper.lookAt(position.clone().add(normal));
  const orientation = helper.rotation.clone();
  orientation.z += degToRad(placement.rotation);
  const size = new THREE.Vector3(placement.size, placement.size, placement.size);
  const decal = new THREE.Mesh(
    new DecalGeometry(mesh, position, orientation, size),
    new THREE.MeshStandardMaterial({
      map,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      roughness: 0.5,
      metalness: 0,
    }),
  );
  decal.renderOrder = 1;
  return decal;
}

function stickerEntry(position: Vec3, normal: Vec3) {
  return [
    "{",
    '  id: "new",',
    '  kind: "hobby",',
    '  label: "",',
    '  image: "/3d/stickers/coffee.svg",',
    `  position: [${position.join(", ")}],`,
    `  normal: [${normal.join(", ")}],`,
    "  size: 0.08,",
    "  rotation: 0,",
    "},",
  ].join("\n");
}

function disposeScene(scene: THREE.Scene) {
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if ("map" in material && material.map instanceof THREE.Texture) material.map.dispose();
      material.dispose();
    }
  });
}

export function Tour() {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("static");
  const [active, setActive] = useState(0);
  const [placed, setPlaced] = useState<string | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const scroller = scrollerRef.current;
    if (!root || !stage || !scroller) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.85;
    renderer.domElement.setAttribute("aria-hidden", "true");
    stage.appendChild(renderer.domElement);

    const placing = new URLSearchParams(window.location.search).has("place");

    const scene = new THREE.Scene();
    const tint = new THREE.Color(stops[0].tint);
    const tints = stops.map((stop) => new THREE.Color(stop.tint));
    scene.background = tint;

    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = environment;
    scene.environmentIntensity = 0.4;

    const key = new THREE.DirectionalLight("#fff1e0", 1.6);
    key.position.set(2, 3, 2.5);
    scene.add(key, new THREE.HemisphereLight("#fff8f0", "#b9a893", 0.35));

    const group = new THREE.Group();
    group.add(groundShadow(0.42, 0.24));
    scene.add(group);

    // The workstation sits outside the swaying group. Only the bust breathes.
    const texture = (url: string) => flatTexture(url, renderer);
    const workstation = buildWorkstation(tour.workstation, texture);
    const workstationStop = stops.findIndex((stop) => stop.id === tour.workstation.stopId);
    scene.add(workstation.group);

    const camera = new THREE.PerspectiveCamera(stops[0].camera.fov, 1, 0.05, 20);
    const curve = (points: Vec3[]) => new THREE.CatmullRomCurve3(points.map(vec), false, "centripetal");
    const paths = {
      wide: {
        positions: curve(stops.map((stop) => stop.camera.position)),
        targets: curve(stops.map((stop) => stop.camera.target)),
      },
      tall: {
        positions: curve(stops.map((stop) => stop.camera.phone.position)),
        targets: curve(stops.map((stop) => stop.camera.phone.target)),
      },
    };

    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    let model: THREE.Mesh | null = null;
    let cancelled = false;
    let settled = false;
    let disposed = false;
    let frame = 0;

    let width = 1;
    let height = 1;
    const resize = () => {
      width = Math.max(1, stage.clientWidth);
      height = Math.max(1, stage.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    resize();

    let tTarget = 0;
    let tSmooth = 0;
    const readScroll = () => {
      const range = scroller.offsetHeight - window.innerHeight;
      const scrolled = -scroller.getBoundingClientRect().top;
      tTarget = range > 0 ? clamp(scrolled / range, 0, 1) * last : 0;
    };
    readScroll();
    tSmooth = tTarget;
    window.addEventListener("scroll", readScroll, { passive: true });
    window.addEventListener("resize", readScroll);

    const pointer = new THREE.Vector2();
    const parallax = new THREE.Vector2();
    const onPointerMove = (event: PointerEvent) => {
      pointer.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        1 - (event.clientY / window.innerHeight) * 2,
      );
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    const raycaster = new THREE.Raycaster();
    const pressed = new THREE.Vector2();
    const onPointerDown = (event: PointerEvent) => pressed.set(event.clientX, event.clientY);
    const onPointerUp = (event: PointerEvent) => {
      if (!placing || !model) return;
      if (pressed.distanceTo(new THREE.Vector2(event.clientX, event.clientY)) > 6) return;
      const rect = renderer.domElement.getBoundingClientRect();
      raycaster.setFromCamera(
        new THREE.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          1 - ((event.clientY - rect.top) / rect.height) * 2,
        ),
        camera,
      );
      const hit = raycaster.intersectObject(model, false)[0];
      if (!hit?.face) return;
      const normal = hit.face.normal
        .clone()
        .applyMatrix3(new THREE.Matrix3().getNormalMatrix(model.matrixWorld))
        .normalize();
      const placement: Placement = {
        position: round3(hit.point),
        normal: round3(normal),
        size: 0.08,
        rotation: 0,
      };
      group.add(makeDecal(model, placement, texture("/3d/stickers/coffee.svg")));
      const entry = stickerEntry(placement.position, placement.normal);
      console.log(entry);
      setPlaced(entry);
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);

    const dispose = () => {
      if (disposed) return;
      disposed = true;
      cancelled = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", readScroll);
      window.removeEventListener("resize", readScroll);
      window.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      disposeScene(scene);
      environment.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      root.style.backgroundColor = "";
      setMode("static");
    };

    loader.load(
      tour.model.src,
      (gltf) => {
        if (cancelled) return;
        gltf.scene.traverse((object) => {
          if (object instanceof THREE.Mesh && !model) model = object;
        });
        if (!model) return;
        const mesh: THREE.Mesh = model;
        mesh.material = new THREE.MeshStandardMaterial({
          color: tour.model.material.color,
          roughness: tour.model.material.roughness,
          metalness: 0,
        });
        group.rotation.y = 0;
        group.add(gltf.scene);
        group.updateMatrixWorld(true);
        for (const sticker of tour.stickers) {
          group.add(makeDecal(mesh, sticker, texture(sticker.image)));
        }
        settled = true;
        setMode("live");
      },
      undefined,
      () => {
        if (cancelled) return;
        settled = true;
        dispose();
      },
    );

    const hash = window.location.hash.slice(1);
    const startIndex = stops.findIndex((stop) => stop.id === hash);

    const clock = new THREE.Clock();
    const cameraTarget = new THREE.Vector3();
    const right = new THREE.Vector3();
    const up = new THREE.Vector3();
    let activeIndex = -1;
    let currentTint = "";

    const loop = () => {
      if (disposed) return;
      frame = requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), 0.05);
      const time = clock.elapsedTime;
      const ease = 1 - Math.exp(-dt * 6);
      tSmooth += (tTarget - tSmooth) * ease;
      const u = last > 0 ? tSmooth / last : 0;
      const i0 = Math.min(Math.floor(tSmooth), last);
      const i1 = Math.min(i0 + 1, last);
      const f = tSmooth - i0;

      const path = camera.aspect < 1 ? paths.tall : paths.wide;
      path.positions.getPoint(u, camera.position);
      path.targets.getPoint(u, cameraTarget);
      camera.lookAt(cameraTarget);
      parallax.lerp(pointer, 1 - Math.exp(-dt * 4));
      right.setFromMatrixColumn(camera.matrix, 0);
      up.setFromMatrixColumn(camera.matrix, 1);
      camera.position.addScaledVector(right, 0.05 * parallax.x).addScaledVector(up, 0.03 * parallax.y);
      camera.lookAt(cameraTarget);
      camera.fov = lerp(stops[i0].camera.fov, stops[i1].camera.fov, f);
      camera.updateProjectionMatrix();

      tint.lerpColors(tints[i0], tints[i1], f);
      const hex = `#${tint.getHexString()}`;
      if (hex !== currentTint) {
        currentTint = hex;
        root.style.backgroundColor = hex;
      }

      group.rotation.y = placing ? 0 : Math.sin(time * 0.35) * 0.04;

      // Fully present at its own stop, gone by the time the next one arrives.
      const near = clamp((1 - Math.abs(tSmooth - workstationStop)) / 0.72, 0, 1);
      workstation.update(near * near * (3 - 2 * near), time, camera);

      const index = Math.round(tSmooth);
      if (index !== activeIndex) {
        activeIndex = index;
        setActive(index);
        const next = `#${stops[index].id}`;
        if (window.location.hash !== next) window.history.replaceState(null, "", next);
      }

      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(() => {
      if (disposed) return;
      flushSync(() => {
        setMode(settled ? "live" : "loading");
      });
      if (startIndex > 0) {
        const spacer = document.getElementById(stops[startIndex].id);
        if (spacer?.classList.contains("tour-spacer")) {
          window.scrollTo({ top: spacer.getBoundingClientRect().top + window.scrollY, behavior: "instant" });
          readScroll();
          tSmooth = tTarget;
        }
      }
      if (placing) setPlaced("Click the bust to place a sticker.");
      loop();
    });

    return dispose;
  }, []);

  const isStatic = mode === "static";

  return (
    <div className="tour" data-mode={mode} ref={rootRef}>
      <header className="tour-bar">
        <a className="tour-home" href={`#${stops[0].id}`}>
          Conny Zhou
        </a>
        <nav className="tour-tags" aria-label="Tour stops">
          {stops.map((stop, i) => (
            <a
              key={stop.id}
              className="tour-tag"
              href={`#${stop.id}`}
              aria-current={!isStatic && i === active ? "true" : undefined}
            >
              {stop.tag}
            </a>
          ))}
        </nav>
      </header>

      <div className="tour-scroller" ref={scrollerRef}>
        <div className="tour-stage" ref={stageRef}>
          {/* eslint-disable-next-line @next/next/no-img-element -- poster is a plain static file under public/ */}
          <img className="tour-poster" src={tour.model.poster} alt={tour.model.posterAlt} />
          <div className="tour-cards">
            {stops.map((stop, i) => (
              <article
                key={stop.id}
                className="tour-card"
                id={isStatic ? stop.id : undefined}
                data-active={!isStatic && i === active ? "true" : undefined}
                aria-hidden={!isStatic && i !== active ? true : undefined}
              >
                <p className="tour-eyebrow">{stop.eyebrow}</p>
                <h2 className="tour-title">{stop.title}</h2>
                <p className="tour-body">{stop.body}</p>
                <ul className="tour-links">
                  {stop.links.map((link) => (
                    <li key={link.href}>
                      <a href={link.href}>{link.label}</a>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          {placed ? <pre className="tour-place">{placed}</pre> : null}
          <p className="tour-credit">
            <span className="tour-credit-full">{tour.model.credit.text} </span>
            <a href={tour.model.credit.href} rel="noopener">
              Lincoln 3D Scans
            </a>
            . <span className="tour-credit-full">{tour.model.credit.license} </span>
            Einstein is a stand-in.
          </p>
        </div>
        {isStatic ? null : (
          <div className="tour-spacers" aria-hidden="true">
            {stops.map((stop) => (
              <div key={stop.id} id={stop.id} className="tour-spacer" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
