"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import * as THREE from "three";
import { DecalGeometry } from "three/examples/jsm/geometries/DecalGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { tour, type Sticker, type TourModel, type TourStop, type Vec3 } from "@/content/tour";
import { groundShadow } from "./clay";
import { buildWorkstation } from "./workstation";
import { repairConnyEar, tuneConnyHair } from "./character-material";
import { createDecalInteraction } from "./decal-interaction";
import { createConnyAttention } from "./character-attention";
import { createAttentionMotion } from "./attention-motion";
import { createPreparedCharacterAttention, legacyAttentionDriver } from "./prepared-character-attention";
import { resolvePose, sampleMotion, type PoseMotion } from "./tour-motion";

type Mode = "static" | "loading" | "live";

type Placement = Pick<Sticker, "position" | "normal" | "size" | "rotation">;

const stops: readonly TourStop[] = tour.stops;
const stickers: readonly Sticker[] = tour.stickers;
const model3d: TourModel = tour.model;
const last = stops.length - 1;
const { clamp, degToRad } = THREE.MathUtils;

const vec = (v: Vec3) => new THREE.Vector3(v[0], v[1], v[2]);

const round3 = (v: THREE.Vector3): Vec3 => [
  Number(v.x.toFixed(3)),
  Number(v.y.toFixed(3)),
  Number(v.z.toFixed(3)),
];

function flatTexture(url: string, renderer: THREE.WebGLRenderer, manager: THREE.LoadingManager) {
  const map = new THREE.TextureLoader(manager).load(url);
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
  const [loadProgress, setLoadProgress] = useState(0);
  const [hovered, setHovered] = useState<{ sticker: Sticker; position?: { x: number; y: number } } | null>(null);

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

    const incomingHash = window.location.hash;
    const restoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch {
      window.history.scrollRestoration = restoration;
      return;
    }
    if (!renderer.extensions.has("EXT_color_buffer_float") && !renderer.extensions.has("EXT_color_buffer_half_float")) {
      renderer.dispose();
      window.history.scrollRestoration = restoration;
      return;
    }
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    renderer.domElement.setAttribute("aria-hidden", "true");
    stage.appendChild(renderer.domElement);

    const placing = new URLSearchParams(window.location.search).has("place");
    const startIndex = Math.max(0, stops.findIndex((stop) => `#${stop.id}` === incomingHash));
    const workstationStop = stops.findIndex((stop) => stop.id === tour.workstation.stopId);
    let phase: "loading" | "warming" | "live" | "disposed" = "loading";
    let assetsReady = false;
    let layoutReady = false;
    let frame = 0;
    let layoutFrame = 0;
    let warmFrame = 0;
    let lastRenderAt = 0;
    let workstationTime = 0;
    let intent = { progress: startIndex, stop: startIndex };
    let view = resolvePose(stops, startIndex, window.innerWidth < window.innerHeight, workstationStop);
    let motion: PoseMotion | null = null;
    let model: THREE.Mesh | null = null;
    let characterOccluders: THREE.Mesh[] = [];
    let attention: ReturnType<typeof createAttentionMotion> | null = null;

    const scene = new THREE.Scene();
    scene.background = view.tint.clone();
    const group = new THREE.Group();
    scene.add(group);
    const manager = new THREE.LoadingManager();
    manager.onProgress = (_url, loaded, total) => {
      if (phase !== "disposed") setLoadProgress((previous) => Math.max(previous, Math.round(loaded / total * 92)));
    };
    manager.onLoad = () => {
      if (phase === "disposed") return;
      assetsReady = true;
      if (phase === "loading") void warmScene();
      else invalidate();
    };

    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    let environment = pmrem.fromScene(room, 0.04);
    room.dispose();
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.6;
    const key = new THREE.DirectionalLight("#fff1e0", 1.05);
    key.position.set(-2, 3, 3);
    const fill = new THREE.DirectionalLight("#d8e8ff", 1.4);
    fill.position.set(2, 1.5, 2);
    const rim = new THREE.DirectionalLight("#f5e3c8", 3.4);
    rim.position.set(-1, 2, -2);
    scene.add(key, fill, rim, new THREE.HemisphereLight("#dae5f2", "#4c3223", 0.15));

    const texture = (url: string) => flatTexture(url, renderer, manager);
    const workstation = buildWorkstation(tour.workstation, texture);
    scene.add(workstation.group);
    const camera = new THREE.PerspectiveCamera(view.fov, 1, 0.05, 20);
    const composer = new EffectComposer(renderer);
    const bokeh = new BokehPass(scene, camera, { focus: 2, aperture: 0.012, maxblur: 0.009 });
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.13, 0.45, 1.05);
    const output = new OutputPass();
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(bokeh);
    composer.addPass(bloom);
    composer.addPass(output);
    const cameraForward = new THREE.Vector3();
    const focusOffset = new THREE.Vector3();

    function invalidate() {
      if (phase === "live" && !frame) frame = requestAnimationFrame(renderFrame);
    }

    const decals = placing ? null : createDecalInteraction({
      canvas: renderer.domElement,
      camera,
      occluders: () => characterOccluders,
      onHover: (sticker, position) => setHovered(sticker ? { sticker, position } : null),
      onActivate: (sticker) => navigateTo(stops.findIndex((stop) => stop.id === sticker.stopId), true),
      invalidate,
    });

    function applyView() {
      camera.position.copy(view.position);
      camera.lookAt(view.target);
      camera.fov = view.fov;
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld(true);
      camera.getWorldDirection(cameraForward);
      const focus = Math.max(camera.near, focusOffset.copy(view.focalPoint).sub(view.position).dot(cameraForward));
      bokeh.materialBokeh.uniforms.focus.value = focus;
      bokeh.materialBokeh.uniforms.aperture.value = view.aperture;
      bokeh.materialBokeh.uniforms.maxblur.value = view.maxblur;
      (scene.background as THREE.Color).copy(view.tint);
      root!.style.backgroundColor = `#${view.tint.getHexString()}`;
      workstation.update(view.workstation, workstationTime, camera);
    }

    function renderFrame() {
      frame = 0;
      if (phase !== "live") return;
      const now = performance.now();
      const dt = Math.min(Math.max((now - lastRenderAt) / 1000, 0), 0.05);
      lastRenderAt = now;
      if (motion) {
        view = sampleMotion(motion, now);
        workstationTime += dt;
        if (now >= motion.startedAt + motion.duration) {
          view = motion.to;
          motion = null;
        }
      }
      applyView();
      const attending = attention?.update(now) ?? false;
      const hovering = decals?.update(dt) ?? false;
      root!.dataset.transitioning = String(Boolean(motion));
      try {
        composer.render(dt);
      } catch {
        returnToStatic();
        return;
      }
      if (motion || hovering || attending) invalidate();
    }

    function requestPose(progress: number, push = false, immediate = false, force = false) {
      if (phase === "disposed") return;
      progress = clamp(progress, 0, last);
      const index = Math.round(progress);
      const hash = `#${stops[index].id}`;
      if (window.location.hash !== hash) {
        window.history[push ? "pushState" : "replaceState"](window.history.state, "", hash);
      }
      if (index !== intent.stop) flushSync(() => setActive(index));
      const changed = Math.abs(progress - intent.progress) > 0.00001;
      intent = { progress, stop: index };
      if (!changed && !force && !immediate) return;
      const destination = resolvePose(stops, progress, camera.aspect < 1, workstationStop);
      decals?.clear();
      if (immediate || phase !== "live") {
        view = destination;
        motion = null;
      } else {
        motion = { from: view, to: destination, startedAt: performance.now(), duration: 520 };
      }
      root!.dataset.transitioning = String(Boolean(motion));
      invalidate();
    }

    function readScroll() {
      if (!layoutReady || phase === "disposed") return;
      const range = scroller!.offsetHeight - window.innerHeight;
      const scrolled = -scroller!.getBoundingClientRect().top;
      requestPose(range > 0 ? clamp(scrolled / range, 0, 1) * last : 0);
    }

    function navigateTo(index: number, push: boolean, immediate = false) {
      if (phase === "disposed" || index < 0) return;
      const spacer = document.getElementById(stops[index].id);
      if (spacer?.classList.contains("tour-spacer")) {
        window.scrollTo({ top: spacer.getBoundingClientRect().top + window.scrollY, behavior: "instant" });
      }
      requestPose(index, push, immediate);
    }
    const indexFromHash = () => stops.findIndex((stop) => `#${stop.id}` === window.location.hash);
    const onHashNavigation = () => navigateTo(indexFromHash(), false);
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) navigateTo(Math.max(0, indexFromHash()), false, true);
    };
    const onNavigationClick = (event: MouseEvent) => {
      if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>(".tour-tag, .tour-home, .tour-sticker-link") : null;
      if (!anchor) return;
      const index = stops.findIndex((stop) => anchor.hash === `#${stop.id}`);
      if (index < 0) return;
      event.preventDefault();
      navigateTo(index, true);
    };
    root.addEventListener("click", onNavigationClick);
    window.addEventListener("scroll", readScroll, { passive: true });
    window.addEventListener("hashchange", onHashNavigation);
    window.addEventListener("popstate", onHashNavigation);
    window.addEventListener("pageshow", onPageShow);

    let width = 0;
    let height = 0;
    function resize() {
      if (root!.dataset.mode === "static" || phase === "disposed") return;
      const nextWidth = Math.max(1, stage!.clientWidth);
      const nextHeight = Math.max(1, stage!.clientHeight);
      if (width === nextWidth && height === nextHeight) return;
      width = nextWidth;
      height = nextHeight;
      const ratio = Math.min(window.devicePixelRatio, 1.5, Math.sqrt(2_000_000 / (width * height)));
      renderer.setPixelRatio(ratio);
      renderer.setSize(width, height, false);
      composer.setPixelRatio(ratio);
      composer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      requestPose(intent.progress, false, true, true);
    }
    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    window.addEventListener("resize", readScroll);

    const pressed = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    const onPointerDown = (event: PointerEvent) => pressed.set(event.clientX, event.clientY);
    const onPointerUp = (event: PointerEvent) => {
      if (!placing || !model || pressed.distanceTo(new THREE.Vector2(event.clientX, event.clientY)) > 6) return;
      const rect = renderer.domElement.getBoundingClientRect();
      raycaster.setFromCamera(new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        1 - ((event.clientY - rect.top) / rect.height) * 2,
      ), camera);
      const hit = raycaster.intersectObject(model, false)[0];
      if (!hit?.face) return;
      const normal = hit.face.normal.clone().applyMatrix3(new THREE.Matrix3().getNormalMatrix(model.matrixWorld)).normalize();
      const placement: Placement = { position: round3(hit.point), normal: round3(normal), size: 0.08, rotation: 0 };
      group.add(makeDecal(model, placement, texture("/3d/stickers/coffee.svg")));
      const entry = stickerEntry(placement.position, placement.normal);
      console.log(entry);
      setPlaced(entry);
      invalidate();
    };
    if (placing) {
      renderer.domElement.addEventListener("pointerdown", onPointerDown);
      renderer.domElement.addEventListener("pointerup", onPointerUp);
    }

    function dispose() {
      if (phase === "disposed") return;
      phase = "disposed";
      cancelAnimationFrame(frame);
      cancelAnimationFrame(layoutFrame);
      cancelAnimationFrame(warmFrame);
      observer.disconnect();
      root!.removeEventListener("click", onNavigationClick);
      window.removeEventListener("scroll", readScroll);
      window.removeEventListener("resize", readScroll);
      window.removeEventListener("hashchange", onHashNavigation);
      window.removeEventListener("popstate", onHashNavigation);
      window.removeEventListener("pageshow", onPageShow);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      motionPreference.removeEventListener("change", onMotionChange);
      decals?.dispose();
      attention?.dispose();
      disposeObject(scene);
      environment.dispose();
      pmrem.dispose();
      bokeh.dispose();
      bloom.dispose();
      output.dispose();
      composer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      root!.style.backgroundColor = "";
      delete root!.dataset.transitioning;
      window.history.scrollRestoration = restoration;
    }

    function returnToStatic() {
      if (phase === "disposed") return;
      const stop = stops[intent.stop];
      dispose();
      flushSync(() => { setMode("static"); setHovered(null); });
      document.getElementById(stop.id)?.scrollIntoView({ behavior: "instant", block: "start" });
    }
    const onContextLost = (event: Event) => { event.preventDefault(); returnToStatic(); };
    const onMotionChange = (event: MediaQueryListEvent) => { if (event.matches) returnToStatic(); };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);
    motionPreference.addEventListener("change", onMotionChange);

    const afterFrame = () => new Promise<void>((resolve) => { warmFrame = requestAnimationFrame(() => resolve()); });
    async function warmScene() {
      if (phase !== "loading" || !assetsReady || !layoutReady || !model) return;
      phase = "warming";
      const culling = new Map<THREE.Object3D, boolean>();
      try {
        applyView();
        attention?.update(performance.now());
        workstation.update(1, 0, camera);
        const maps = new Set<THREE.Texture>();
        scene.traverse((object) => {
          culling.set(object, object.frustumCulled);
          object.frustumCulled = false;
          if (!(object instanceof THREE.Mesh)) return;
          for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
            for (const value of Object.values(material)) if (value instanceof THREE.Texture) maps.add(value);
          }
        });
        for (const map of maps) renderer.initTexture(map);
        await renderer.compileAsync(scene, camera);
        if (phase !== "warming") return;
        composer.render(0);
        for (const [object, frustumCulled] of culling) object.frustumCulled = frustumCulled;
        setLoadProgress(98);
        await afterFrame();
        if (phase !== "warming") return;
        view = resolvePose(stops, intent.progress, camera.aspect < 1, workstationStop);
        applyView();
        attention?.update(performance.now());
        composer.render(0);
        phase = "live";
        attention?.start();
        lastRenderAt = performance.now();
        root!.dataset.transitioning = "false";
        flushSync(() => { setLoadProgress(100); setMode("live"); });
      } catch {
        returnToStatic();
      }
    }

    new HDRLoader(manager).load("/3d/studio-environment.hdr", (hdr) => {
      if (phase === "disposed") { hdr.dispose(); return; }
      const next = pmrem.fromEquirectangular(hdr);
      hdr.dispose();
      environment.dispose();
      environment = next;
      scene.environment = environment.texture;
    }, undefined, () => {});
    const loader = new GLTFLoader(manager);
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load(model3d.src, (gltf) => {
      if (phase === "disposed") { disposeObject(gltf.scene); return; }
      const meshes: THREE.Mesh[] = [];
      gltf.scene.traverse((object) => {
        if (object instanceof THREE.Mesh && object.geometry.getAttribute("position")?.count) meshes.push(object);
      });
      const bounds = new THREE.Box3().setFromObject(gltf.scene);
      const size = bounds.getSize(new THREE.Vector3());
      if (!meshes.length || bounds.isEmpty() || size.y <= 1e-6 || ![...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite)) {
        disposeObject(gltf.scene);
        returnToStatic();
        return;
      }
      const prepared = model3d.src === "/3d/conny-character.glb";
      const mesh = prepared ? meshes.find((part) => part.name === "ConnyShirt") : stickerSurface(meshes);
      if (!mesh) {
        disposeObject(gltf.scene);
        returnToStatic();
        return;
      }
      model = mesh;
      characterOccluders = meshes;
      const replacedMaterials = new Set<THREE.Material>();
      for (const part of meshes) {
        if (model3d.material && !prepared) {
          for (const material of Array.isArray(part.material) ? part.material : [part.material]) replacedMaterials.add(material);
          part.material = new THREE.MeshStandardMaterial({ color: model3d.material.color, roughness: model3d.material.roughness, metalness: 0 });
        }
        for (const material of Array.isArray(part.material) ? part.material : [part.material]) {
          if (model3d.src === "/3d/conny-bust.glb" && !model3d.material && material instanceof THREE.MeshStandardMaterial) {
            repairConnyEar(material);
            tuneConnyHair(material);
          }
          if (!prepared && "roughness" in material) material.roughness = model3d.finish.roughness;
          if (!prepared && "metalness" in material) material.metalness = model3d.finish.metalness;
        }
      }
      disposeMaterials(replacedMaterials);
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
      group.add(shadow, rig);
      group.updateMatrixWorld(true);
      if (prepared) {
        const face = createPreparedCharacterAttention(gltf.scene);
        if (!face) {
          returnToStatic();
          return;
        }
        attention = createAttentionMotion({ face, camera, surface: renderer.domElement, pointerSurface: root, invalidate, interactive: !placing });
      } else if (model3d.src === "/3d/conny-bust.glb" && !model3d.material) {
        const face = createConnyAttention(mesh, renderer);
        if (face) {
          // Three r186 exposes _materialDepth; its declaration still names materialDepth.
          const depthMaterial = (bokeh as BokehPass & { _materialDepth: THREE.MeshDepthMaterial })._materialDepth;
          face.applyDepthMaterial(depthMaterial);
          attention = createAttentionMotion({ face: legacyAttentionDriver(face), camera, surface: renderer.domElement, pointerSurface: root, invalidate, interactive: !placing });
        }
      }
      for (const sticker of stickers) {
        const decal = makeDecal(mesh, sticker, texture(sticker.image));
        group.add(decal);
        decals?.add(decal, sticker);
      }
    }, undefined, () => { if (phase !== "disposed") returnToStatic(); });

    layoutFrame = requestAnimationFrame(() => {
      if (phase === "disposed") return;
      flushSync(() => { setMode("loading"); setActive(intent.stop); });
      resize();
      layoutFrame = requestAnimationFrame(() => {
        if (phase === "disposed") return;
        navigateTo(intent.stop, false, true);
        layoutReady = true;
        if (placing) setPlaced("Click the bust to place a sticker.");
        void warmScene();
      });
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
              aria-label={stop.tag}
              aria-current={!isStatic && i === active ? "true" : undefined}
            >
              {stop.tag}
            </a>
          ))}
        </nav>
      </header>

      <div className="tour-scroller" id={isStatic ? "start" : undefined} ref={scrollerRef}>
        <div className="tour-stage" ref={stageRef}>
          {/* eslint-disable-next-line @next/next/no-img-element -- poster is a plain static file under public/ */}
          <img className="tour-poster" src={model3d.poster} alt={model3d.posterAlt} />
          <div className="tour-viewfinder" aria-hidden="true" />
          {!isStatic ? (
            <div className="tour-loading" data-ready={mode === "live"} aria-hidden={mode === "live"}>
              <span className="tour-loading-label" role="status">Preparing the scene</span>
              <span className="tour-loading-count">{String(loadProgress).padStart(3, "0")} / 100</span>
            </div>
          ) : null}
          <div className="tour-cards">
            {stops.map((stop, i) => (
              <article
                key={stop.id}
                className="tour-card"
                id={isStatic && i > 0 ? stop.id : undefined}
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
          {hovered && mode === "live" ? (
            <p className="tour-sticker-caption" style={{ left: hovered.position?.x, top: hovered.position?.y, bottom: "auto" }}>
              {stops.find((stop) => stop.id === hovered.sticker.stopId)?.tag}
            </p>
          ) : null}
          {!isStatic ? (
            <>
              <nav className="tour-sticker-links" aria-label="Explore the stickers">
                {stickers.filter((sticker) => sticker.stopId).map((sticker) => (
                  <a className="tour-sticker-link" key={sticker.id} href={`#${sticker.stopId}`}>{sticker.label}</a>
                ))}
              </nav>
              <p className="tour-location">Boston, MA</p>
              <p className="tour-index" aria-hidden="true">{String(active + 1).padStart(2, "0")} / {String(stops.length).padStart(2, "0")}</p>
              {active === 0 && mode === "live" ? <p className="tour-scroll-hint">Scroll to explore</p> : null}
            </>
          ) : null}
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
