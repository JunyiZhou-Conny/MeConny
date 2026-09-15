import * as THREE from "three";

/**
 * A soft blob on the floor. The scene has no shadow map, so every object that
 * touches the ground gets one of these instead.
 */
export function groundShadow(radius: number, alpha: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
    gradient.addColorStop(0, `rgba(26, 22, 19, ${alpha})`);
    gradient.addColorStop(1, "rgba(26, 22, 19, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
  }
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 48),
    new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(canvas),
      transparent: true,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.002;
  return shadow;
}

/**
 * A slab with rounded corners and a soft bevel, centered on its own origin.
 * Width and height run along x and y; the extrusion runs along z. Everything
 * in the workstation is built from these, so nothing in the scene has a hard
 * machined edge.
 */
export function roundedPlate(width: number, height: number, depth: number, radius: number) {
  const r = Math.min(radius, width / 2 - 0.0005, height / 2 - 0.0005);
  const w = width / 2 - r;
  const h = height / 2 - r;
  const shape = new THREE.Shape();
  shape.absarc(-w, -h, r, Math.PI, Math.PI * 1.5, false);
  shape.absarc(w, -h, r, Math.PI * 1.5, Math.PI * 2, false);
  shape.absarc(w, h, r, 0, Math.PI * 0.5, false);
  shape.absarc(-w, h, r, Math.PI * 0.5, Math.PI, false);
  const bevel = Math.min(r * 0.4, depth * 0.3);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(depth - bevel * 2, 0.0002),
    bevelEnabled: bevel > 0.0001,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 2,
    curveSegments: 8,
  });
  geometry.center();
  return geometry;
}
