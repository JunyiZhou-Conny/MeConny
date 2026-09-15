import * as THREE from "three";
import type { Vec3, Workstation } from "@/content/tour";
import { groundShadow, roundedPlate } from "./clay";

const { degToRad } = THREE.MathUtils;

/** Same clay family as the bust, one step warmer for the furniture. */
const paint = {
  deskTop: "#dcc6a6",
  deskLeg: "#c3a888",
  shell: "#e7ddce",
  well: "#c8bba7",
};

const LID_TILT = 14;

type Tile = { mesh: THREE.Mesh; baseY: number; phase: number };

function clay(color: string, roughness = 0.72) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0,
    transparent: true,
    opacity: 0,
  });
}

/**
 * The Job Search stop, built as a scene rather than a card: a mini desk, a lit
 * screen for the editor, four tool tiles floating over it, and dots running a
 * closed loop between them. The whole rig fades in as the scroll approaches
 * its stop, so the other five stops stay clean.
 */
export function buildWorkstation(
  data: Workstation,
  texture: (url: string) => THREE.Texture,
) {
  const group = new THREE.Group();
  group.position.set(...(data.position as unknown as [number, number, number]));
  group.rotation.y = degToRad(data.rotation);
  group.visible = false;

  const materials: THREE.Material[] = [];
  const track = <T extends THREE.Material>(material: T) => {
    materials.push(material);
    return material;
  };

  const shadow = groundShadow(0.22, 0.2);
  shadow.scale.set(1.35, 0.78, 1);
  track(shadow.material as THREE.Material);
  group.add(shadow);

  const deskTop = new THREE.Mesh(
    roundedPlate(0.46, 0.26, 0.022, 0.03),
    track(clay(paint.deskTop)),
  );
  deskTop.rotation.x = -Math.PI / 2;
  deskTop.position.y = 0.205;
  group.add(deskTop);

  const legGeometry = roundedPlate(0.21, 0.195, 0.026, 0.012);
  const legMaterial = track(clay(paint.deskLeg, 0.8));
  for (const x of [-0.202, 0.202]) {
    const leg = new THREE.Mesh(legGeometry, legMaterial);
    leg.rotation.y = Math.PI / 2;
    leg.position.set(x, 0.0975, 0);
    group.add(leg);
  }

  const shell = track(clay(paint.shell, 0.58));

  const base = new THREE.Mesh(roundedPlate(0.235, 0.152, 0.012, 0.016), shell);
  base.rotation.x = -Math.PI / 2;
  base.position.set(0, 0.222, 0.028);
  group.add(base);

  const well = new THREE.Mesh(
    roundedPlate(0.198, 0.092, 0.003, 0.01),
    track(clay(paint.well, 0.85)),
  );
  well.rotation.x = -Math.PI / 2;
  well.position.set(0, 0.2285, 0.052);
  group.add(well);

  // The lid hinges off the back edge of the base, so the screen leans back
  // instead of standing on its own floating pivot.
  const tilt = degToRad(LID_TILT);
  const lid = new THREE.Mesh(roundedPlate(0.235, 0.152, 0.009, 0.016), shell);
  lid.rotation.x = -tilt;
  lid.position.set(0, 0.228 + Math.cos(tilt) * 0.076, -0.048 - Math.sin(tilt) * 0.076);
  group.add(lid);

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.206, 0.129),
    track(
      new THREE.MeshBasicMaterial({
        map: texture(data.screen),
        transparent: true,
        opacity: 0,
      }),
    ),
  );
  screen.position.z = 0.0055;
  lid.add(screen);

  const tiles: Tile[] = data.tiles.map((entry) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(entry.size, entry.size),
      track(
        new THREE.MeshBasicMaterial({
          map: texture(entry.image),
          transparent: true,
          opacity: 0,
          depthWrite: false,
        }),
      ),
    );
    mesh.position.set(...(entry.position as unknown as [number, number, number]));
    mesh.rotation.order = "YXZ";
    mesh.rotation.x = -degToRad(6);
    mesh.rotation.z = degToRad(entry.rotation);
    group.add(mesh);
    return { mesh, baseY: entry.position[1], phase: entry.phase };
  });

  const curve = new THREE.CatmullRomCurve3(
    data.loop.points.map((point: Vec3) => new THREE.Vector3(...point)),
    true,
    "centripetal",
  );
  const thread = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 200, 0.0035, 6, true),
    track(
      new THREE.MeshStandardMaterial({
        color: "#8c8073",
        roughness: 0.9,
        metalness: 0,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    ),
  );
  group.add(thread);

  const dotGeometry = new THREE.SphereGeometry(0.018, 18, 12);
  const dots = data.loop.colors.map((color) => {
    const dot = new THREE.Mesh(
      dotGeometry,
      track(
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.35,
          roughness: 0.45,
          metalness: 0,
          transparent: true,
          opacity: 0,
        }),
      ),
    );
    group.add(dot);
    return dot;
  });

  const camLocal = new THREE.Vector3();

  return {
    group,
    /**
     * @param reveal 0 when the rig is out of the story, 1 at its own stop.
     * @param time seconds since the scene started.
     */
    update(reveal: number, time: number, camera: THREE.Camera) {
      group.visible = reveal > 0.005;
      if (!group.visible) return;

      for (const material of materials) material.opacity = reveal;
      group.scale.setScalar(data.scale * (0.9 + 0.1 * reveal));
      group.position.y = data.position[1] + (reveal - 1) * 0.06;
      group.updateMatrixWorld();

      camLocal.copy(camera.position);
      group.worldToLocal(camLocal);
      for (const { mesh, baseY, phase } of tiles) {
        mesh.rotation.y = Math.atan2(camLocal.x - mesh.position.x, camLocal.z - mesh.position.z);
        mesh.position.y = baseY + Math.sin(time * 0.9 + phase) * 0.011;
      }

      for (const [i, dot] of dots.entries()) {
        curve.getPointAt((time * data.loop.speed + i / dots.length) % 1, dot.position);
      }
    },
  };
}
