import * as THREE from "three";
import type { Sticker } from "@/content/tour";

type Decal = {
  mesh: THREE.Mesh;
  sticker: Sticker;
  position: THREE.Vector3;
  normal: THREE.Vector3;
  amount: number;
  alpha?: { pixels: Uint8ClampedArray; width: number; height: number };
};

type Options = {
  canvas: HTMLCanvasElement;
  camera: THREE.Camera;
  occluders: () => THREE.Object3D[];
  onHover: (sticker: Sticker | null, position?: { x: number; y: number }) => void;
  onActivate: (sticker: Sticker) => void;
  invalidate: () => void;
};

export function createDecalInteraction(options: Options) {
  const { canvas, camera, occluders, onHover, onActivate, invalidate } = options;
  const decals = new Map<THREE.Object3D, Decal>();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const press = new THREE.Vector2();
  let hovered: Decal | undefined;
  let pointerDirty = false;
  let pressing = false;

  const opaque = (decal: Decal, uv: THREE.Vector2 | undefined) => {
    if (!uv) return false;
    if (!decal.alpha) {
      const material = decal.mesh.material as THREE.MeshStandardMaterial;
      const image = material.map?.image as HTMLImageElement | undefined;
      if (!image?.width || !image.height) return false;
      const sample = document.createElement("canvas");
      sample.width = image.width;
      sample.height = image.height;
      const context = sample.getContext("2d", { willReadFrequently: true });
      if (!context) return false;
      context.drawImage(image, 0, 0);
      decal.alpha = { pixels: context.getImageData(0, 0, image.width, image.height).data, width: image.width, height: image.height };
    }
    const { pixels, width, height } = decal.alpha;
    const x = THREE.MathUtils.clamp(Math.floor(uv.x * width), 0, width - 1);
    const y = THREE.MathUtils.clamp(Math.floor((1 - uv.y) * height), 0, height - 1);
    return pixels[(y * width + x) * 4 + 3] > 100;
  };

  const pick = () => {
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects([...decals.keys()], false).find((hit) => opaque(decals.get(hit.object)!, hit.uv));
    if (!hit) return;
    const body = raycaster.intersectObjects(occluders(), true)[0];
    if (body && body.distance < hit.distance - 0.012) return;
    return decals.get(hit.object);
  };

  const select = (decal: Decal | undefined) => {
    if (decal === hovered) return;
    hovered = decal;
    canvas.style.cursor = decal ? "pointer" : "";
    if (decal) {
      const projected = decal.position.clone().project(camera);
      onHover(decal.sticker, {
        x: THREE.MathUtils.clamp((projected.x + 1) * canvas.clientWidth / 2 + 14, 16, canvas.clientWidth - 176),
        y: THREE.MathUtils.clamp((1 - projected.y) * canvas.clientHeight / 2 + 12, 108, canvas.clientHeight - 52),
      });
    } else onHover(null);
    invalidate();
  };

  const move = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
    pointerDirty = true;
    invalidate();
  };
  const leave = () => { pointerDirty = false; pressing = false; select(undefined); };
  const down = (event: PointerEvent) => {
    if (event.button !== 0) return;
    press.set(event.clientX, event.clientY);
    pressing = true;
    move(event);
  };
  const up = (event: PointerEvent) => {
    if (!pressing) return;
    pressing = false;
    if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > 6) return;
    move(event);
    const decal = pick();
    if (decal) { select(undefined); onActivate(decal.sticker); }
  };
  canvas.addEventListener("pointermove", move, { passive: true });
  canvas.addEventListener("pointerleave", leave);
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", leave);

  return {
    add(mesh: THREE.Mesh, sticker: Sticker) {
      if (!sticker.stopId) return;
      const position = new THREE.Vector3(...sticker.position);
      mesh.geometry.translate(-position.x, -position.y, -position.z);
      mesh.position.copy(position);
      decals.set(mesh, { mesh, sticker, position, normal: new THREE.Vector3(...sticker.normal).normalize(), amount: 0 });
    },
    update(dt: number) {
      if (pointerDirty) { pointerDirty = false; select(pick()); }
      let moving = false;
      for (const decal of decals.values()) {
        const target = decal === hovered ? 1 : 0;
        decal.amount = THREE.MathUtils.damp(decal.amount, target, 20, dt);
        if (Math.abs(decal.amount - target) < 0.001) decal.amount = target;
        else moving = true;
        decal.mesh.position.copy(decal.position).addScaledVector(decal.normal, decal.amount * 0.004);
        decal.mesh.scale.setScalar(1 + decal.amount * 0.06);
      }
      return moving;
    },
    clear() { pointerDirty = false; pressing = false; select(undefined); },
    dispose() {
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerleave", leave);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", leave);
      canvas.style.cursor = "";
      decals.clear();
    },
  };
}
