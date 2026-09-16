import * as T from "three";
// Calibrated only to conny-bust.glb: fitted = raw position * .5 + (0,.5,0).
type Eye = {
  x: number;
  y: number;
};
type Vertex = {
  p: T.Vector3;
  n: T.Vector3;
  uv: T.Vector2;
};
const eyes: Eye[] = [{ x: -.092, y: .652 }, { x: .091, y: .652 }];
export type ConnyAttention = {
  setPose(pitch: number, yaw: number, roll: number): boolean;
  setGaze(x: number, y: number): boolean;
  setBlink(amount: number): boolean;
  gazeFor(cameraWorld: T.Vector3, pointerX?: number, pointerY?: number): T.Vector2;
  applyDepthMaterial(material: T.MeshDepthMaterial): void;
  dispose(): void;
};
// Face 8794 maps to black atlas padding; coincident healthy vertices supply its cheek UVs.
function correctedCheekGeometry(source: T.BufferGeometry) {
  const corrected = source.clone();
  const positions = source.getAttribute("position");
  const index = source.index;
  const pairs = [[7191, 1709], [7192, 1718], [7193, 1720]] as const;
  const matches = index && pairs.every(([target, healthy], corner) =>
    index.getX(8794 * 3 + corner) === target &&
    positions.getX(target) === positions.getX(healthy) &&
    positions.getY(target) === positions.getY(healthy) &&
    positions.getZ(target) === positions.getZ(healthy));
  if (!matches || !index) return corrected;
  for (const [target] of pairs) {
    let uses = 0;
    for (let i = 0; i < index.count; i++) if (index.getX(i) === target) uses++;
    if (uses !== 1) return corrected;
  }
  const uv = corrected.getAttribute("uv");
  for (const [target, healthy] of pairs) uv.setXY(target, uv.getX(healthy), uv.getY(healthy));
  uv.needsUpdate = true;
  return corrected;
}

function blinkGeometry(source: T.BufferGeometry) {
  const probeMaterial = new T.MeshBasicMaterial({ side: T.DoubleSide });
  const original = new T.Mesh(source, probeMaterial);
  original.scale.setScalar(.5);
  original.position.set(0, .5, 0);
  original.updateMatrixWorld(true);
  const depthProfiles = eyes.map(e => Array.from({ length: 17 }, (_, i) => {
    const nx = i / 8 - 1;
    const ray = new T.Raycaster(new T.Vector3(e.x + nx * .051, e.y - .007 * Math.sqrt(Math.max(0, 1 - nx * nx)), 1), new T.Vector3(0, 0, -1));
    return ray.intersectObject(original)[0]?.point.z ?? .18;
  }));
  function depthAt(x: number, e: Eye) {
    const list = depthProfiles[eyes.indexOf(e)];
    const u = T.MathUtils.clamp((x - e.x) / .051 + 1, 0, 2) * 8;
    const i = Math.floor(u);
    const t = u - i;
    const a = list[Math.max(0, i - 1)];
    const b = list[Math.min(16, i)];
    const c = list[Math.min(16, i + 1)];
    const d = list[Math.min(16, i + 2)];
    return .5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
  }
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const p = source.getAttribute('position');
  const n = source.getAttribute('normal');
  const uv = source.getAttribute('uv');
  const index = source.index!;
  function vert(i: number): Vertex {
    return { p: new T.Vector3().fromBufferAttribute(p, i), n: new T.Vector3().fromBufferAttribute(n, i), uv: new T.Vector2(uv.getX(i), uv.getY(i)) };
  }
  function mid(a: Vertex, b: Vertex): Vertex {
    return { p: a.p.clone().add(b.p).multiplyScalar(.5), n: a.n.clone().add(b.n).normalize(), uv: a.uv.clone().add(b.uv).multiplyScalar(.5) };
  }
  function tri(a: Vertex, b: Vertex, c: Vertex, level: number): void {
    if (level) {
      const ab = mid(a, b);
      const bc = mid(b, c);
      const ca = mid(c, a);
      tri(a, ab, ca, level - 1);
      tri(ab, b, bc, level - 1);
      tri(ca, bc, c, level - 1);
      tri(ab, bc, ca, level - 1);
    }
    else
      for (const v of [a, b, c]) {
        positions.push(...v.p);
        normals.push(...v.n);
        uvs.push(...v.uv);
      }
  }
  for (let i = 0; i < index.count; i += 3) {
    const a = vert(index.getX(i));
    const b = vert(index.getX(i + 1));
    const c = vert(index.getX(i + 2));
    const v = a.p.clone().add(b.p).add(c.p).multiplyScalar(1 / 6).add(new T.Vector3(0, .5, 0));
    tri(a, b, c, Math.abs(v.x) < .18 && Math.abs(v.x) > .02 && v.y > .59 && v.y < .72 && v.z > .13 ? 2 : 0);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  g.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2));
  const closed = positions.slice();
  for (let i = 0; i < closed.length; i += 3) {
    const x = positions[i] * .5;
    const y = positions[i + 1] * .5 + .5;
    const z = positions[i + 2] * .5;
    if (z < .12)
      continue;
    for (const e of eyes) {
      const nx = (x - e.x) / .051;
      if (Math.abs(nx) >= 1)
        continue;
      const edge = Math.sqrt(1 - nx * nx);
      const dy = y - e.y;
      const top = .023 * edge;
      const bottom = -.023 * edge;
      const mid = -.007 * edge;
      let next = dy;
      if (dy >= bottom && dy <= top)
        next = mid;
      else if (dy > top && dy < top + .03)
        next = dy - (top - mid) * (1 - T.MathUtils.smoothstep(dy, top, top + .03));
      else if (dy < bottom && dy > bottom - .026)
        next = dy + (mid - bottom) * (1 - T.MathUtils.smoothstep(bottom - dy, 0, .026));
      closed[i + 1] = (e.y + next - .5) * 2;
      const lidWeightBase = dy >= bottom && dy <= top ? 1 : dy > top ? 1 - T.MathUtils.smoothstep(dy, top, top + .03) : 1 - T.MathUtils.smoothstep(bottom - dy, 0, .026);
      const lidWeight = lidWeightBase * Math.pow(edge, .6);
      if (lidWeight > 0) {
        closed[i + 2] = T.MathUtils.lerp(z, depthAt(x, e) + .0002, lidWeight) * 2;
      }
    }
  }
  g.morphAttributes.position = [new T.Float32BufferAttribute(closed, 3)];
  const closedMesh = new T.BufferGeometry();
  closedMesh.setAttribute('position', new T.Float32BufferAttribute(closed, 3));
  closedMesh.computeVertexNormals();
  const cn = closedMesh.getAttribute('normal');
  const sums = new Map<string, T.Vector3>();
  const keys: string[] = [];
  for (let i = 0; i < cn.count; i++) {
    const key = [positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]].map(x => Math.round(x * 1e5)).join(',');
    keys.push(key);
    if (!sums.has(key))
      sums.set(key, new T.Vector3());
    sums.get(key)!.add(new T.Vector3().fromBufferAttribute(cn, i));
  }
  const morphedNormals: number[] = [];
  for (let i = 0; i < cn.count; i++) {
    const sum = sums.get(keys[i])!.clone().normalize();
    const old = new T.Vector3(normals[i * 3], normals[i * 3 + 1], normals[i * 3 + 2]);
    const distance = Math.hypot(closed[i * 3] - positions[i * 3], closed[i * 3 + 1] - positions[i * 3 + 1], closed[i * 3 + 2] - positions[i * 3 + 2]);
    if (sum.lengthSq() < .1)
      sum.copy(old);
    morphedNormals.push(...old.lerp(sum, T.MathUtils.smoothstep(distance, .002, .025)).normalize());
  }
  g.morphAttributes.normal = [new T.Float32BufferAttribute(morphedNormals, 3)];
  closedMesh.dispose();
  probeMaterial.dispose();
  g.computeBoundingSphere();
  return g;
}
type Shader = Parameters<T.Material["onBeforeCompile"]>[0];
function headShader(shader: Shader, pose: T.Vector3) {
  shader.uniforms.connyHeadPose = { value: pose };
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", `#include <common>
   attribute float connyAttentionMask;
   varying vec3 vConnyOriginalFace;
   varying vec3 vConnyBlinkSurface;
   uniform vec3 connyHeadPose;
   mat3 connyHeadRotation(vec3 a) {
    float cx=cos(a.x),sx=sin(a.x),cy=cos(a.y),sy=sin(a.y),cz=cos(a.z),sz=sin(a.z);
    return mat3(cz,sz,0.,-sz,cz,0.,0.,0.,1.)
     * mat3(cy,0.,-sy,0.,1.,0.,sy,0.,cy)
     * mat3(1.,0.,0.,0.,cx,sx,0.,-sx,cx);
   }
  `)
    .replace("#include <morphnormal_vertex>", `#include <morphnormal_vertex>
   float connyNormalWeight=smoothstep(.31,.49,position.y*.5+.5)*connyAttentionMask;
   objectNormal=connyHeadRotation(connyHeadPose*connyNormalWeight)*objectNormal;
  `)
    .replace("#include <begin_vertex>", `#include <begin_vertex>
   vConnyOriginalFace=position*.5+vec3(0.,.5,0.);
  `)
    .replace("#include <morphtarget_vertex>", `#include <morphtarget_vertex>
   vec3 connyPoint=transformed*.5+vec3(0.,.5,0.);
   vConnyBlinkSurface=connyPoint;
   float connyWeight=smoothstep(.31,.49,connyPoint.y)*connyAttentionMask;
   connyPoint=connyHeadRotation(connyHeadPose*connyWeight)*(connyPoint-vec3(0.,.34,0.))+vec3(0.,.34,0.);
   transformed=(connyPoint-vec3(0.,.5,0.))*2.;
  `);
}
function eyeProjection(geometry: T.BufferGeometry, map: T.Texture, renderer: T.WebGLRenderer) {
  // Reproject the existing eye texture once. Both eyes cross multiple atlas
  // islands; simply translating their original UVs smears unrelated face parts.
  const target = new T.WebGLRenderTarget(1024, 512, { depthBuffer: true });
  target.texture.colorSpace = T.LinearSRGBColorSpace;
  const material = new T.MeshBasicMaterial({ map, side: T.DoubleSide });
  const portrait = new T.Mesh(geometry, material);
  portrait.scale.setScalar(.5);
  portrait.position.set(0, .5, 0);
  const scene = new T.Scene();
  scene.add(portrait);
  const camera = new T.OrthographicCamera(-.18, .18, .085, -.085, .01, 10);
  camera.position.set(0, .635, 2);
  camera.lookAt(0, .635, 0);
  const oldTarget = renderer.getRenderTarget();
  const oldToneMapping = renderer.toneMapping;
  const oldColor = renderer.getClearColor(new T.Color());
  const oldAlpha = renderer.getClearAlpha();
  try {
    renderer.toneMapping = T.NoToneMapping;
    renderer.setRenderTarget(target);
    renderer.setClearColor(0, 0);
    renderer.clear();
    renderer.render(scene, camera);
  }
  finally {
    renderer.setRenderTarget(oldTarget);
    renderer.toneMapping = oldToneMapping;
    renderer.setClearColor(oldColor, oldAlpha);
    material.dispose();
  }
  return target;
}
/** Opt in only for /3d/conny-bust.glb with its original textured material. */
export function createConnyAttention(mesh: T.Mesh, renderer: T.WebGLRenderer): ConnyAttention | null {
  const originalGeometry = mesh.geometry;
  const material = mesh.material;
  if (!(material instanceof T.MeshStandardMaterial) || !material.map ||
    originalGeometry.getAttribute("position")?.count !== 12674 || originalGeometry.index?.count !== 45000 ||
    !originalGeometry.getAttribute("normal") || !originalGeometry.getAttribute("uv") ||
    Object.keys(originalGeometry.morphAttributes).length)
    return null;
  const calibratedGeometry = correctedCheekGeometry(originalGeometry);
  let projection: T.WebGLRenderTarget | undefined;
  let geometry: T.BufferGeometry;
  try {
    projection = eyeProjection(calibratedGeometry, material.map, renderer);
    geometry = blinkGeometry(calibratedGeometry);
  } catch (error) {
    projection?.dispose();
    throw error;
  } finally {
    calibratedGeometry.dispose();
  }
  geometry.setAttribute("connyAttentionMask", new T.Float32BufferAttribute(new Float32Array(geometry.getAttribute("position").count).fill(1), 1));
  const pose = new T.Vector3();
  const gaze = new T.Vector2();
  const blink = { value: 0 };
  const oldCompile = material.onBeforeCompile;
  const oldCacheKey = material.customProgramCacheKey;
  const oldInfluences = mesh.morphTargetInfluences;
  const oldDictionary = mesh.morphTargetDictionary;
  mesh.geometry = geometry;
  mesh.updateMorphTargets();
  mesh.morphTargetDictionary = { connyBlink: 0 };
  const restoreDepth: (() => void)[] = [];
  material.onBeforeCompile = (shader, gl) => {
    oldCompile.call(material, shader, gl);
    headShader(shader, pose);
    shader.uniforms.connyGaze = { value: gaze };
    shader.uniforms.connyBlink = blink;
    shader.uniforms.connyEyePhoto = { value: projection.texture };
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>
    varying vec3 vConnyOriginalFace;
    varying vec3 vConnyBlinkSurface;
    uniform vec2 connyGaze;
    uniform float connyBlink;
    uniform sampler2D connyEyePhoto;
   `)
      .replace("#include <map_fragment>", `#include <map_fragment>
    if(vConnyOriginalFace.z>.12){for(int i=0;i<2;i++){
     vec2 center=vec2(i==0?-.092:.091,.652);
     vec2 localEye=vConnyBlinkSurface.xy-center;
     float nx=localEye.x/.051;
     float edge=sqrt(max(0.,1.-nx*nx));
     float top=.023*edge,bottom=-.023*edge,middle=-.007*edge;
     float upper=mix(top,middle,connyBlink),lower=mix(bottom,middle,connyBlink);
     vec2 delta=connyGaze*vec2(.008,.004);
     vec2 iris=vec2(i==0?-.0847:.0822,.652);
     float mask=1.-smoothstep(.023,.031,min(length(vConnyBlinkSurface.xy-iris),length(vConnyBlinkSurface.xy-iris-delta)));
     if(abs(nx)<1.&&localEye.y>=lower&&localEye.y<=upper){
      vec2 eyeUv=(vConnyBlinkSurface.xy-delta-vec2(-.18,.55))/vec2(.36,.17);
      diffuseColor.rgb=mix(diffuseColor.rgb,texture2D(connyEyePhoto,eyeUv).rgb,mask);
     }
     float crease=(1.-smoothstep(.00055,.0015,abs(localEye.y-middle)))
      *(1.-smoothstep(.8,1.,abs(nx)))*smoothstep(.78,.98,connyBlink);
     diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.027,.012,.007),crease);
    }}
   `);
  };
  material.customProgramCacheKey = () => `${oldCacheKey.call(material)}-conny-attention-v1`;
  material.needsUpdate = true;
  const cameraLocal = new T.Vector3();
  const result = new T.Vector2();
  const inverseHead = new T.Quaternion();
  const neck = new T.Vector3(0, .34, 0);
  const headEuler = new T.Euler(0, 0, 0, "ZYX");
  let disposed = false;
  return {
    setPose(pitch, yaw, roll) {
      const x = T.MathUtils.clamp(pitch, -.045, .045);
      const y = T.MathUtils.clamp(yaw, -.075, .075);
      const z = T.MathUtils.clamp(roll, -.025, .025);
      const changed = pose.x !== x || pose.y !== y || pose.z !== z;
      pose.set(x, y, z);
      return changed;
    },
    setGaze(x, y) {
      x = T.MathUtils.clamp(x, -1, 1);
      y = T.MathUtils.clamp(y, -1, 1);
      const changed = gaze.x !== x || gaze.y !== y;
      gaze.set(x, y);
      return changed;
    },
    setBlink(amount) {
      const value = T.MathUtils.clamp(amount, 0, 1);
      const changed = blink.value !== value;
      blink.value = value;
      if (mesh.morphTargetInfluences)
        mesh.morphTargetInfluences[0] = value;
      return changed;
    },
    gazeFor(cameraWorld, pointerX = 0, pointerY = 0) {
      mesh.updateWorldMatrix(true, false);
      cameraLocal.copy(cameraWorld);
      mesh.worldToLocal(cameraLocal);
      cameraLocal.multiplyScalar(.5).add(new T.Vector3(0, .5, 0)).sub(neck);
      inverseHead.setFromEuler(headEuler.set(pose.x, pose.y, pose.z)).invert();
      cameraLocal.applyQuaternion(inverseHead).add(neck);
      const depth = Math.max(.1, cameraLocal.z - .194);
      return result.set(T.MathUtils.clamp(Math.atan2(cameraLocal.x, depth) / .28 + pointerX * .45, -1, 1), T.MathUtils.clamp(Math.atan2(cameraLocal.y - .652, depth) / .16 + pointerY * .32, -1, 1));
    },
    applyDepthMaterial(depth) {
      // Bokeh shares this override material with every mesh. Missing custom
      // attributes must default to zero so only this bust rotates in depth.
      const depthDefaults = depth as T.MeshDepthMaterial & {
        defaultAttributeValues?: Record<string, number[]>;
      };
      const oldDefaults = depthDefaults.defaultAttributeValues;
      depthDefaults.defaultAttributeValues = { ...oldDefaults, connyAttentionMask: [0] };
      const previousCompile = depth.onBeforeCompile;
      const previousKey = depth.customProgramCacheKey;
      depth.onBeforeCompile = (shader, gl) => {
        previousCompile.call(depth, shader, gl);
        headShader(shader, pose);
      };
      depth.customProgramCacheKey = () => `${previousKey.call(depth)}-conny-head-depth-v1`;
      depth.needsUpdate = true;
      restoreDepth.push(() => {
        depthDefaults.defaultAttributeValues = oldDefaults;
        depth.onBeforeCompile = previousCompile;
        depth.customProgramCacheKey = previousKey;
        depth.needsUpdate = true;
      });
    },
    dispose() {
      if (disposed)
        return;
      disposed = true;
      for (const restore of restoreDepth)
        restore();
      mesh.geometry = originalGeometry;
      mesh.morphTargetInfluences = oldInfluences;
      mesh.morphTargetDictionary = oldDictionary;
      material.onBeforeCompile = oldCompile;
      material.customProgramCacheKey = oldCacheKey;
      material.needsUpdate = true;
      geometry.dispose();
      projection.dispose();
    },
  };
}
