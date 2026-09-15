/**
 * Data for the /3d tour. One typed table drives both the DOM (tag buttons,
 * stop cards, poster alt text, credit line) and the scene (camera path,
 * decals). The scroll position maps to one number t in [0, stops.length - 1].
 * Everything else is derived from t, so there is no second source of truth
 * for "which stop is active".
 *
 * Coordinates are model space. The bust is 1 unit tall, its lowest point sits
 * at y = 0, its footprint is centered on x and z, and the face looks down +z.
 * Sticker positions and normals come from raycasts against public/3d/einstein.glb.
 * To place a new sticker, open /3d?place=1 and click the bust. The console
 * prints a ready-to-paste sticker entry.
 */

export type Vec3 = readonly [number, number, number];

export type TourLink = {
  href: string;
  label: string;
};

export type TourStop = {
  /** Stable id, used for the section id, the tag button, and the URL hash. */
  id: string;
  /** Short label on the tag button. */
  tag: string;
  eyebrow: string;
  title: string;
  body: string;
  links: readonly TourLink[];
  camera: {
    position: Vec3;
    target: Vec3;
    /** Vertical field of view in degrees. */
    fov: number;
  };
  /** Page and canvas background while this stop is active. */
  tint: string;
};

export type StickerKind = "hobby" | "work";

export type Sticker = {
  id: string;
  kind: StickerKind;
  /** Alt text and the label printed by the placement tool. */
  label: string;
  /** Square image, served from public/. */
  image: string;
  /** Point on the surface of the model. */
  position: Vec3;
  /** Outward surface normal at that point. */
  normal: Vec3;
  /** Edge length in model units. */
  size: number;
  /** Rotation around the normal, in degrees. */
  rotation: number;
};

export type TourModel = {
  /** GLB with EXT_meshopt_compression and KHR_mesh_quantization. */
  src: string;
  /** Still of the first stop. Shown for prefers-reduced-motion, no JavaScript, and while the GLB loads. */
  poster: string;
  posterAlt: string;
  /** Clay color and surface for the single mesh. */
  material: {
    color: string;
    roughness: number;
  };
  credit: {
    text: string;
    href: string;
    license: string;
  };
};

export type Tour = {
  title: string;
  description: string;
  model: TourModel;
  stops: readonly TourStop[];
  stickers: readonly Sticker[];
};

export const tour = {
  title: "Meet Conny in 3D",
  description:
    "A scroll tour around a bust with stickers for work and hobbies. Einstein is the stand-in until Conny's own figure arrives.",
  model: {
    src: "/3d/einstein.glb",
    poster: "/3d/poster.jpg",
    posterAlt:
      "A clay-colored bust of Albert Einstein on a block, with round stickers on the forehead, cheeks, hair, and base.",
    material: {
      color: "#e2cdb4",
      roughness: 0.62,
    },
    credit: {
      text: "Bust: Albert Einstein by Artur Loewenthal, bronze, 1930. Scanned by Oliver Laric for Lincoln 3D Scans, The Collection, Lincoln.",
      href: "http://lincoln3dscans.co.uk/lowenthal-bust-one/",
      license: "Published without copyright restrictions.",
    },
  },
  stops: [
    {
      id: "start",
      tag: "Start",
      eyebrow: "Meet Conny, stand-in edition",
      title: "Hi. I am holding this spot.",
      body: "This bust is a 1930 bronze of Albert Einstein from a free museum scan. Conny's own figure replaces it soon. Scroll, or tap a tag, and the camera flies to the next stop.",
      links: [{ href: "/", label: "Back to the hub" }],
      camera: {
        position: [0.95, 0.78, 1.75],
        target: [0, 0.6, 0],
        fov: 32,
      },
      tint: "#F2ECE2",
    },
    {
      id: "clinical",
      tag: "Clinical AI",
      eyebrow: "Pediatric Savior, shipped 2024",
      title: "Residents run cases. Admins edit the prompts.",
      body: "A GPT-based rapid-cycle simulator for pediatric airway training, built with Emory Pediatrics and Children's Healthcare of Atlanta. Chat, case editor, history, and Auth0 roles on React, Flask, MongoDB, and AWS.",
      links: [
        {
          href: "https://github.com/JunyiZhou-Conny/Airway-Management-Assistant",
          label: "GitHub",
        },
      ],
      camera: {
        position: [-0.62, 0.34, 0.98],
        target: [-0.04, 0.3, 0.1],
        fov: 30,
      },
      tint: "#F7DDC7",
    },
    {
      id: "cells",
      tag: "Cells",
      eyebrow: "speciesOT, in progress",
      title: "Mouse cells in. Human cells out.",
      body: "Optimal transport in a shared autoencoder latent space. One CLI lists models, prints a scorecard, and shows the sbatch chain a human still submits. Results stay off git.",
      links: [
        { href: "https://github.com/JunyiZhou-Conny/speciesOT", label: "GitHub" },
      ],
      camera: {
        position: [-0.92, 0.9, 0.62],
        target: [-0.14, 0.7, 0.04],
        fov: 30,
      },
      tint: "#DCEBE6",
    },
    {
      id: "loops",
      tag: "Loops",
      eyebrow: "scGen / CellOT autoresearch",
      title: "A brain proposes. A substrate keeps running.",
      body: "Fairshare-aware ablation search on FASRC Cannon. 338 experiments over 79.3 cluster hours, 318 completed, 20 handled failures. Public counts only. The science stays unpublished.",
      links: [
        {
          href: "https://github.com/JunyiZhou-Conny/scgen-cellot-autoresearch",
          label: "GitHub",
        },
      ],
      camera: {
        position: [0.78, 0.98, 0.86],
        target: [0.08, 0.74, 0.08],
        fov: 30,
      },
      tint: "#DBDAEA",
    },
    {
      id: "off-hours",
      tag: "Off hours",
      eyebrow: "Hobbies, placeholders for now",
      title: "Stickers first. Stories later.",
      body: "The coffee, camera, bike, and headphones are stand-ins until Conny picks the real ones. Write if the work is useful.",
      links: [
        { href: "https://github.com/JunyiZhou-Conny", label: "GitHub" },
        {
          href: "https://www.linkedin.com/in/junyi-zhou-270208247",
          label: "LinkedIn",
        },
        {
          href: "https://mooneylab.seas.harvard.edu/people/junyi-conny-zhou",
          label: "Mooney Lab",
        },
      ],
      camera: {
        position: [1.05, 0.5, 0.72],
        target: [0.14, 0.36, 0.1],
        fov: 32,
      },
      tint: "#F2ECE2",
    },
  ] satisfies readonly TourStop[],
  stickers: [
    {
      id: "hub",
      kind: "work",
      label: "Terminal sticker that reads ./hub",
      image: "/3d/stickers/hub.svg",
      position: [0, 0.756, 0.22],
      normal: [-0.08, -0.003, 0.997],
      size: 0.085,
      rotation: -6,
    },
    {
      id: "coffee",
      kind: "hobby",
      label: "Coffee cup sticker",
      image: "/3d/stickers/coffee.svg",
      position: [-0.133, 0.563, 0.116],
      normal: [-0.953, -0.237, 0.188],
      size: 0.07,
      rotation: 8,
    },
    {
      id: "camera",
      kind: "hobby",
      label: "Camera sticker",
      image: "/3d/stickers/camera.svg",
      position: [0.15, 0.564, 0.142],
      normal: [0.868, -0.174, 0.465],
      size: 0.07,
      rotation: -10,
    },
    {
      id: "dna",
      kind: "work",
      label: "DNA helix sticker",
      image: "/3d/stickers/dna.svg",
      position: [-0.227, 0.722, 0.073],
      normal: [-0.559, 0.225, 0.798],
      size: 0.08,
      rotation: 14,
    },
    {
      id: "chip",
      kind: "work",
      label: "GPU chip sticker",
      image: "/3d/stickers/chip.svg",
      position: [0.236, 0.722, 0.076],
      normal: [0.581, -0.206, 0.788],
      size: 0.08,
      rotation: -12,
    },
    {
      id: "pulse",
      kind: "work",
      label: "Heart with a pulse line sticker",
      image: "/3d/stickers/pulse.svg",
      position: [-0.1, 0.14, 0.209],
      normal: [0, 0, 1],
      size: 0.1,
      rotation: 6,
    },
    {
      id: "bike",
      kind: "hobby",
      label: "Bicycle sticker",
      image: "/3d/stickers/bike.svg",
      position: [0.1, 0.14, 0.21],
      normal: [0, 0, 1],
      size: 0.1,
      rotation: -5,
    },
    {
      id: "headphones",
      kind: "hobby",
      label: "Headphones sticker",
      image: "/3d/stickers/headphones.svg",
      position: [0.201, 0.14, 0],
      normal: [1, 0, 0],
      size: 0.1,
      rotation: 7,
    },
  ] satisfies readonly Sticker[],
} as const satisfies Tour;
