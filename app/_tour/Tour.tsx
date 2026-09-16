"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import * as THREE from "three";
import { DecalGeometry } from "three/examples/jsm/geometries/DecalGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { tour, type Sticker, type TourModel, type TourStop, type Vec3 } from "@/content/tour";
import { groundShadow } from "./clay";
import { buildWorkstation } from "./workstation";

type Mode = "static" | "loading" | "live";

type Placement = Pick<Sticker, "position" | "normal" | "size" | "rotation">;

const stops: readonly TourStop[] = tour.stops;
const stickers: readonly Sticker[] = tour.stickers;
const model3d: TourModel = tour.model;
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

function disposeMaterials(materials: Iterable<THREE.Material>) {
  const textures = new Set<THREE.Texture>();
  for (const material of new Set(materials)) {
    for (const value of Object.values(material)) {
      if (value instanceof THREE.Texture) textures.add(value);
    }
    material.dispose();
  }
  for (const texture of textures) texture.dispose();
}

function disposeObject(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const skeletons = new Set<THREE.Skeleton>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
    }
    if (object instanceof THREE.SkinnedMesh) skeletons.add(object.skeleton);
  });
  for (const geometry of geometries) geometry.dispose();
  for (const skeleton of skeletons) skeleton.dispose();
  disposeMaterials(materials);
}

function stickerSurface(meshes: THREE.Mesh[]) {
  const named = meshes.find((mesh) => mesh.name === "ConnyBust");
  if (named) return named;
  // Exporters can order separate eyes or hair before the body. Prefer the
  // body's world-space extent rather than the first primitive in the file.
  const size = new THREE.Vector3();
  const bounds = new THREE.Box3();
  return meshes.reduce((largest, mesh) => {
    const extent = bounds.setFromObject(mesh).getSize(size).lengthSq();
    return extent > largest.extent ? { mesh, extent } : largest;
  }, { mesh: meshes[0], extent: -1 }).mesh;
}

export function Tour() {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("static");
  const [active, setActive] = useState(0);
  const [placed, setPlaced] = useState<string | null>(null);

  useEffect(() => {
    const selected = rootRef.current?.querySelector<HTMLElement>('.tour-tag[aria-current="true"]');
    const nav = selected?.parentElement;
    if (!selected || !nav) return;
    const item = selected.getBoundingClientRect();
    const frame = nav.getBoundingClientRect();
    const delta = item.left < frame.left ? item.left - frame.left
      : item.right > frame.right ? item.right - frame.right : 0;
    if (delta) nav.scrollBy({ left: delta, behavior: "instant" });
  }, [active, mode]);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const scroller = scrollerRef.current;
    if (!root || !stage || !scroller) return;
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionPreference.matches) return;

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
    let mixer: THREE.AnimationMixer | null = null;
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
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      motionPreference.removeEventListener("change", onMotionChange);
      mixer?.stopAllAction();
      if (mixer) mixer.uncacheRoot(mixer.getRoot());
      disposeObject(scene);
      environment.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      root.style.backgroundColor = "";
    };

    const returnToStatic = () => {
      if (disposed) return;
      const stop = stops.find((entry) => `#${entry.id}` === window.location.hash)
        ?? stops[Math.round(tSmooth)];
      dispose();
      flushSync(() => setMode("static"));
      document.getElementById(stop.id)?.scrollIntoView({ behavior: "instant", block: "start" });
    };

    const onContextLost = (event: Event) => {
      event.preventDefault();
      // A context can fail after the first frame, including while the model
      // is still loading. Keep the same readable fallback in either case.
      returnToStatic();
    };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);

    const onMotionChange = (event: MediaQueryListEvent) => {
      if (event.matches) returnToStatic();
    };
    motionPreference.addEventListener("change", onMotionChange);

    loader.load(
      model3d.src,
      (gltf) => {
        if (cancelled) {
          disposeObject(gltf.scene);
          return;
        }
        const meshes: THREE.Mesh[] = [];
        gltf.scene.traverse((object) => {
          if (object instanceof THREE.Mesh && object.geometry.getAttribute("position")?.count) {
            meshes.push(object);
          }
        });
        const bounds = new THREE.Box3().setFromObject(gltf.scene);
        const size = bounds.getSize(new THREE.Vector3());
        if (
          !meshes.length || bounds.isEmpty() || size.y <= 1e-6 ||
          ![...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite)
        ) {
          disposeObject(gltf.scene);
          returnToStatic();
          return;
        }
        const mesh = stickerSurface(meshes);
        model = mesh;
        const replacedMaterials = new Set<THREE.Material>();
        for (const part of meshes) {
          if (model3d.material) {
            for (const material of Array.isArray(part.material) ? part.material : [part.material]) {
              replacedMaterials.add(material);
            }
            part.material = new THREE.MeshStandardMaterial({
              color: model3d.material.color,
              roughness: model3d.material.roughness,
              metalness: 0,
            });
          }
          for (const material of Array.isArray(part.material) ? part.material : [part.material]) {
            if ("roughness" in material) material.roughness = model3d.finish.roughness;
            if ("metalness" in material) material.metalness = model3d.finish.metalness;
          }
        }
        disposeMaterials(replacedMaterials);

        // Fit the entire character, including separate eye and hair meshes,
        // to one unit tall, with its base on the floor and centered footprint.
        // The outer yaw turns around that base, independent of export origin.
        const center = bounds.getCenter(new THREE.Vector3());
        const fit = 1 / size.y;
        const fitted = new THREE.Group();
        fitted.scale.setScalar(fit);
        fitted.position.set(-center.x * fit, -bounds.min.y * fit, -center.z * fit);
        fitted.add(gltf.scene);
        const rig = new THREE.Group();
        rig.rotation.y = degToRad(model3d.yaw);
        rig.add(fitted);

        const shadow = groundShadow(0.5, 0.22);
        shadow.scale.set(size.x * fit * 1.06, size.z * fit * 1.25, 1);

        group.rotation.y = 0;
        group.add(shadow, rig);
        group.updateMatrixWorld(true);
        for (const sticker of stickers) {
          group.add(makeDecal(mesh, sticker, texture(sticker.image)));
        }
        // Authored clips supply the actual deformation; painted eyes alone
        // must never be animated as if they had an eyelid or gaze rig.
        if (!placing && gltf.animations.length) {
          mixer = new THREE.AnimationMixer(gltf.scene);
          for (const clip of gltf.animations) mixer.clipAction(clip).play();
        }
        settled = true;
        setMode("live");
      },
      undefined,
      () => {
        if (cancelled) return;
        settled = true;
        returnToStatic();
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

      const tall = camera.aspect < 1;
      const path = tall ? paths.tall : paths.wide;
      path.positions.getPoint(u, camera.position);
      path.targets.getPoint(u, cameraTarget);
      camera.lookAt(cameraTarget);
      parallax.lerp(pointer, 1 - Math.exp(-dt * 4));
      right.setFromMatrixColumn(camera.matrix, 0);
      up.setFromMatrixColumn(camera.matrix, 1);
      camera.position.addScaledVector(right, 0.05 * parallax.x).addScaledVector(up, 0.03 * parallax.y);
      camera.lookAt(cameraTarget);
      const fov = (stop: TourStop) => (tall ? stop.camera.phone.fov : stop.camera.fov);
      camera.fov = lerp(fov(stops[i0]), fov(stops[i1]), f);
      camera.updateProjectionMatrix();

      tint.lerpColors(tints[i0], tints[i1], f);
      const hex = `#${tint.getHexString()}`;
      if (hex !== currentTint) {
        currentTint = hex;
        root.style.backgroundColor = hex;
      }

      group.rotation.y = placing ? 0 : Math.sin(time * 0.35) * 0.04;
      mixer?.update(dt);

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
          <img className="tour-poster" src={model3d.poster} alt={model3d.posterAlt} />
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
                {i === 0 ? <h1 className="tour-title">{stop.title}</h1> : <h2 className="tour-title">{stop.title}</h2>}
                {isStatic && stop.still ? (
                  /* eslint-disable-next-line @next/next/no-img-element -- scene still is a plain static file under public/ */
                  <img
                    className="tour-still"
                    src={stop.still.src}
                    alt={stop.still.alt}
                    width={stop.still.width}
                    height={stop.still.height}
                  />
                ) : null}
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
            <span className="tour-credit-full">{model3d.credit.text}</span>
            <span className="tour-credit-short">{model3d.credit.short}</span>
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
