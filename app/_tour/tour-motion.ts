import * as THREE from "three";
import type { TourStop } from "@/content/tour";

export type ViewPose = {
  position: THREE.Vector3;
  target: THREE.Vector3;
  focalPoint: THREE.Vector3;
  fov: number;
  aperture: number;
  maxblur: number;
  tint: THREE.Color;
  workstation: number;
};

export type PoseMotion = {
  from: ViewPose;
  to: ViewPose;
  startedAt: number;
  duration: number;
};

export function blendPose(from: ViewPose, to: ViewPose, amount: number): ViewPose {
  return {
    position: from.position.clone().lerp(to.position, amount),
    target: from.target.clone().lerp(to.target, amount),
    focalPoint: from.focalPoint.clone().lerp(to.focalPoint, amount),
    fov: THREE.MathUtils.lerp(from.fov, to.fov, amount),
    aperture: THREE.MathUtils.lerp(from.aperture, to.aperture, amount),
    maxblur: THREE.MathUtils.lerp(from.maxblur, to.maxblur, amount),
    tint: from.tint.clone().lerp(to.tint, amount),
    workstation: THREE.MathUtils.lerp(from.workstation, to.workstation, amount),
  };
}

export function resolvePose(stops: readonly TourStop[], progress: number, tall: boolean, workstationStop: number): ViewPose {
  const lower = Math.min(Math.floor(progress), stops.length - 1);
  const upper = Math.min(lower + 1, stops.length - 1);
  const pose = (stop: TourStop): ViewPose => {
    const frame = tall ? stop.camera.phone : stop.camera;
    const position = new THREE.Vector3(...frame.position);
    const target = new THREE.Vector3(...frame.target);
    const focalPoint = stop.camera.focus === undefined
      ? new THREE.Vector3(...(stop.camera.focalPoint ?? frame.target))
      : target.clone().sub(position).normalize().multiplyScalar(stop.camera.focus).add(position);
    return {
      position, target, focalPoint,
      fov: frame.fov,
      aperture: stop.camera.aperture ?? 0.012,
      maxblur: stop.camera.maxblur ?? 0.009,
      tint: new THREE.Color(stop.tint),
      workstation: 0,
    };
  };
  const result = blendPose(pose(stops[lower]), pose(stops[upper]), progress - lower);
  const near = THREE.MathUtils.clamp((1 - Math.abs(progress - workstationStop)) / 0.72, 0, 1);
  result.workstation = near * near * (3 - 2 * near);
  return result;
}

export function sampleMotion(motion: PoseMotion, now: number): ViewPose {
  const elapsed = THREE.MathUtils.clamp((now - motion.startedAt) / motion.duration, 0, 1);
  return blendPose(motion.from, motion.to, 1 - (1 - elapsed) ** 3);
}
