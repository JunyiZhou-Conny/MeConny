import * as THREE from "three";
import type { ConnyAttention } from "./character-attention";

type ViewerLook = {
  cameraWorld: THREE.Vector3;
  eyePointer: THREE.Vector2;
  headPointer: THREE.Vector2;
};

export type CharacterAttention = {
  capabilities: { head: boolean; gaze: boolean; blink: boolean };
  lookAtViewer(look: ViewerLook): void;
  setBlink(closure: number): void;
  dispose(): void;
};

export function legacyAttentionDriver(face: ConnyAttention): CharacterAttention {
  return {
    capabilities: { head: true, gaze: true, blink: true },
    lookAtViewer({ cameraWorld: camera, eyePointer, headPointer }) {
      face.setPose(
        -Math.atan2(camera.y - 0.65, Math.max(camera.z, 0.1)) * 0.18 - headPointer.y * 0.02,
        Math.atan2(camera.x, camera.z) * 0.12 + headPointer.x * 0.045,
        0.012 - headPointer.x * 0.012,
      );
      const gaze = face.gazeFor(camera, eyePointer.x, eyePointer.y);
      face.setGaze(gaze.x, gaze.y);
    },
    setBlink: (closure) => { face.setBlink(closure); },
    dispose: () => face.dispose(),
  };
}

export function createPreparedCharacterAttention(root: THREE.Object3D): CharacterAttention | null {
  const head = root.getObjectByName("Head");
  if (!(head instanceof THREE.Bone) || !head.parent) return null;

  const bindHead = head.quaternion.clone();
  const inverseBindHead = bindHead.clone().invert();
  const faceAnchor = root.getObjectByName("focus_face");
  const cameraLocal = new THREE.Vector3();
  const faceLocal = new THREE.Vector3();
  const offset = new THREE.Quaternion();
  const angles = new THREE.Euler(0, 0, 0, "YXZ");
  const limits = { pitch: 0.032, yaw: 0.05, roll: 0.006 };
  const restoreBounds: (() => void)[] = [];
  root.updateWorldMatrix(true, true);
  const pivotWorld = head.getWorldPosition(new THREE.Vector3());
  root.traverse((object) => {
    if (!(object instanceof THREE.SkinnedMesh) || !object.skeleton.bones.includes(head)) return;
    const previousSphere = object.boundingSphere?.clone() ?? null;
    const previousBox = object.boundingBox?.clone() ?? null;
    object.computeBoundingSphere();
    const sphere = object.boundingSphere!;
    const pivot = object.worldToLocal(pivotWorld.clone());
    const reach = sphere.center.distanceTo(pivot) + sphere.radius;
    // Reserve the maximum possible rotation envelope once. Recomputing every
    // vertex's skinned bounds during pointer motion would be unnecessary work.
    const margin = 2 * reach * Math.sin((limits.pitch + limits.yaw + limits.roll) / 2);
    sphere.radius += margin;
    object.boundingBox?.expandByScalar(margin);
    restoreBounds.push(() => { object.boundingSphere = previousSphere; object.boundingBox = previousBox; });
  });

  return {
    // The supplied model has one connected face with painted eyes. Preserve
    // its wink and open-eye artwork; it has no independent gaze or blink rig.
    capabilities: { head: true, gaze: false, blink: false },
    lookAtViewer({ cameraWorld, headPointer }) {
      // Reset to the authored pose before measuring the viewer. Measuring from
      // the last attention pose would feed head movement back into its target.
      head.quaternion.copy(bindHead);
      head.updateWorldMatrix(true, true);
      head.parent!.worldToLocal(cameraLocal.copy(cameraWorld));
      if (faceAnchor) {
        faceAnchor.getWorldPosition(faceLocal);
        head.parent!.worldToLocal(faceLocal);
      } else faceLocal.copy(head.position);
      cameraLocal.sub(faceLocal).applyQuaternion(inverseBindHead);
      const yaw = THREE.MathUtils.clamp(Math.atan2(cameraLocal.x, cameraLocal.z) * 0.10 + headPointer.x * 0.028, -limits.yaw, limits.yaw);
      const pitch = THREE.MathUtils.clamp(-Math.atan2(cameraLocal.y, Math.hypot(cameraLocal.x, cameraLocal.z)) * 0.08 - headPointer.y * 0.012, -limits.pitch, limits.pitch);
      const roll = THREE.MathUtils.clamp(-headPointer.x * limits.roll, -limits.roll, limits.roll);
      offset.setFromEuler(angles.set(pitch, yaw, roll));
      head.quaternion.copy(bindHead).multiply(offset);
      head.updateWorldMatrix(true, true);
    },
    setBlink() {},
    dispose() {
      head.quaternion.copy(bindHead);
      head.updateWorldMatrix(true, true);
      for (const restore of restoreBounds) restore();
    },
  };
}
