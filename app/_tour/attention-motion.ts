import { MathUtils, PerspectiveCamera, Vector2, Vector3 } from "three";
import type { CharacterAttention } from "./prepared-character-attention";

type Response = {
  eyeFrom: Vector2;
  headFrom: Vector2;
  to: Vector2;
  startedAt: number;
};

type Options = {
  face: CharacterAttention;
  camera: PerspectiveCamera;
  surface: HTMLElement;
  pointerSurface: HTMLElement;
  invalidate: () => void;
  interactive: boolean;
};

export function createAttentionMotion({ face, camera, surface, pointerSurface, invalidate, interactive }: Options) {
  const eyePointer = new Vector2();
  const headPointer = new Vector2();
  const cameraWorld = new Vector3();
  let response: Response | null = null;
  let blinkStartedAt: number | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running = false;

  const requestLook = (target: Vector2) => {
    if (target.distanceTo(response?.to ?? eyePointer) < 0.008) return;
    response = { eyeFrom: eyePointer.clone(), headFrom: headPointer.clone(), to: target, startedAt: performance.now() };
    invalidate();
  };
  const move = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    const rect = surface.getBoundingClientRect();
    requestLook(new Vector2(
      MathUtils.clamp((event.clientX - rect.left) / rect.width * 2 - 1, -1, 1),
      MathUtils.clamp(1 - (event.clientY - rect.top) / rect.height * 2, -1, 1),
    ));
  };
  const leave = () => requestLook(new Vector2());
  const scheduleBlink = () => {
    clearTimeout(timer);
    if (!running || !interactive || document.hidden || !face.capabilities.blink) return;
    timer = setTimeout(() => {
      blinkStartedAt = performance.now();
      invalidate();
    }, 5200 + Math.random() * 2600);
  };
  const visibility = () => {
    clearTimeout(timer);
    blinkStartedAt = null;
    face.setBlink(0);
    if (!document.hidden) { scheduleBlink(); invalidate(); }
  };

  if (interactive) {
    pointerSurface.addEventListener("pointermove", move, { passive: true });
    pointerSurface.addEventListener("pointerleave", leave);
    window.addEventListener("blur", leave);
    document.addEventListener("visibilitychange", visibility);
  }

  return {
    start() { running = true; scheduleBlink(); if (response) invalidate(); },
    update(now: number) {
      if (response) {
        const elapsed = now - response.startedAt;
        const ease = (duration: number) => 1 - (1 - MathUtils.clamp(elapsed / duration, 0, 1)) ** 3;
        eyePointer.copy(response.eyeFrom).lerp(response.to, ease(140));
        headPointer.copy(response.headFrom).lerp(response.to, ease(280));
        if (elapsed >= 280) response = null;
      }
      camera.getWorldPosition(cameraWorld);
      face.lookAtViewer({ cameraWorld, eyePointer, headPointer });
      if (blinkStartedAt !== null) {
        const elapsed = now - blinkStartedAt;
        const amount = elapsed < 70 ? MathUtils.smoothstep(elapsed, 0, 70)
          : elapsed < 115 ? 1 : 1 - MathUtils.smoothstep(elapsed, 115, 240);
        face.setBlink(amount);
        if (elapsed >= 240) { blinkStartedAt = null; scheduleBlink(); }
      }
      return response !== null || blinkStartedAt !== null;
    },
    dispose() {
      running = false;
      clearTimeout(timer);
      pointerSurface.removeEventListener("pointermove", move);
      pointerSurface.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave);
      document.removeEventListener("visibilitychange", visibility);
      face.dispose();
    },
  };
}
