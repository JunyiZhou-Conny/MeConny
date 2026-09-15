/**
 * Data for the homepage tour. One typed table drives both the DOM (tag
 * buttons, stop cards, poster alt text, credit line) and the scene (camera
 * path, decals, workstation). The scroll position maps to one number t in
 * [0, stops.length - 1]. Everything else is derived from t, so there is no
 * second source of truth for "which stop is active".
 *
 * Coordinates are model space. The bust is 1 unit tall, its lowest point sits
 * at y = 0, its footprint is centered on x and z, and the face looks down +z.
 * Laptop cameras leave the right third of the frame for the card. Phone
 * cameras stand farther back, because the card sits at the bottom there.
 * Sticker positions and normals come from raycasts against public/3d/einstein.glb.
 * To place a new sticker, open /?place=1 and click the bust. The console
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
    /** Used instead of position and target when the viewport is taller than wide. */
    phone: {
      position: Vec3;
      target: Vec3;
    };
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

/** One floating card in the Job Search workstation. */
export type WorkstationTile = {
  id: string;
  /** What the tile draws. The wordmark is baked into the image. */
  label: string;
  /** Square image with a transparent background, served from public/. */
  image: string;
  /** Center of the tile, in workstation-local units. */
  position: Vec3;
  /** Edge length in workstation-local units. */
  size: number;
  /** Tilt in the tile plane, in degrees. */
  rotation: number;
  /** Offset on the shared bob cycle, in seconds. */
  phase: number;
};

/**
 * The Job Search stop is a scene, not a card on its own. A mini desk, a lit
 * screen, four tool tiles, and dots running a closed loop between them.
 * The rig has its own local frame: the desk sits on y = 0, centered on x,
 * facing +z before `rotation` is applied. It is placed in model space by
 * `position`, `rotation`, and `scale`, and it fades in near its stop.
 */
export type Workstation = {
  /** Id of the stop this rig belongs to. */
  stopId: string;
  /** Where the rig stands in model space. */
  position: Vec3;
  /** Yaw in degrees. Zero faces +z, like the bust. */
  rotation: number;
  scale: number;
  /** Texture for the laptop screen. */
  screen: string;
  tiles: readonly WorkstationTile[];
  /** Closed path the agent dots run, in workstation-local units. */
  loop: {
    points: readonly Vec3[];
    /** One dot per color, spaced evenly around the loop. */
    colors: readonly string[];
    /** Loops per second. */
    speed: number;
  };
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
  workstation: Workstation;
};

export const tour = {
  title: "Junyi (Conny) Zhou",
  description:
    "A scroll tour through clinical AI, cross-species cell transport, a job-search operating system, and the agent loops behind them. Einstein is a stand-in until Conny's own figure arrives.",
  model: {
    src: "/3d/einstein.glb",
    poster: "/3d/poster.jpg",
    posterAlt:
      "A clay-colored bust of Albert Einstein on a block, with round stickers on the forehead, hair, and base.",
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
      links: [{ href: "/hub", label: "The written hub" }],
      camera: {
        position: [1.05, 0.74, 1.9],
        target: [0.16, 0.52, 0],
        fov: 32,
        phone: {
          position: [0.9, 0.72, 2.3],
          target: [0, 0.62, 0],
        },
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
        position: [-0.6, 0.5, 1.05],
        target: [-0.04, 0.36, 0.1],
        fov: 30,
        phone: {
          position: [-0.8, 0.62, 1.55],
          target: [-0.04, 0.4, 0.1],
        },
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
        phone: {
          position: [-1.35, 1.02, 0.92],
          target: [-0.14, 0.7, 0.04],
        },
      },
      tint: "#DCEBE6",
    },
    {
      id: "jobs",
      tag: "Job search",
      eyebrow: "Job Search OS, running since July 2026",
      title: "A browser agent applies. A policy file says when.",
      body: "Cursor writes the policy and compiles it into one runtime file. A Polar Browser agent reads that file and works the queue. GitHub holds the audit. A Google Sheet holds the run state. Submit stays gated per plane.",
      links: [
        {
          href: "https://github.com/JunyiZhou-Conny/job-search-2026-2027-starter",
          label: "GitHub",
        },
      ],
      camera: {
        position: [0.92, 0.88, 1.98],
        target: [0.04, 0.5, 0.14],
        fov: 36,
        phone: {
          position: [-1.66, 0.92, 1.84],
          target: [-0.3, 0.4, 0.34],
        },
      },
      tint: "#DCE6F0",
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
        phone: {
          position: [1.12, 1.16, 1.24],
          target: [0.08, 0.76, 0.08],
        },
      },
      tint: "#DBDAEA",
    },
    {
      id: "off-hours",
      tag: "Off hours",
      eyebrow: "Hobbies, placeholders for now",
      title: "Stickers first. Stories later.",
      body: "The bike and the headphones are stand-ins until Conny picks the real ones. Write if the work is useful.",
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
        phone: {
          position: [1.5, 0.6, 1.02],
          target: [0.14, 0.4, 0.1],
        },
      },
      tint: "#F2ECE2",
    },
  ] satisfies readonly TourStop[],
  /**
   * Story cues, not scatter. Three on the head and three on the base. The Job
   * Search stop carries no sticker on purpose: its cue is the workstation.
   */
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
  workstation: {
    stopId: "jobs",
    position: [-0.42, 0, 0.46],
    rotation: 12,
    scale: 0.82,
    screen: "/3d/workstation/screen.svg",
    tiles: [
      {
        id: "cursor",
        label: "Cursor, the thinking desk",
        image: "/3d/workstation/cursor.svg",
        position: [-0.245, 0.435, 0.02],
        size: 0.125,
        rotation: -7,
        phase: 0,
      },
      {
        id: "polar",
        label: "Polar Browser, the action layer",
        image: "/3d/workstation/polar.svg",
        position: [-0.085, 0.52, 0.03],
        size: 0.125,
        rotation: 4,
        phase: 1.3,
      },
      {
        id: "github",
        label: "GitHub, the system state",
        image: "/3d/workstation/github.svg",
        position: [0.085, 0.52, 0.03],
        size: 0.125,
        rotation: -4,
        phase: 2.5,
      },
      {
        id: "sheets",
        label: "Google Sheets, the tracker",
        image: "/3d/workstation/sheets.svg",
        position: [0.245, 0.435, 0.02],
        size: 0.125,
        rotation: 7,
        phase: 3.8,
      },
    ],
    loop: {
      points: [
        [-0.32, 0.41, -0.01],
        [-0.17, 0.56, -0.02],
        [0.02, 0.59, -0.01],
        [0.21, 0.53, -0.02],
        [0.32, 0.38, -0.02],
        [0.19, 0.27, 0.04],
        [0, 0.245, 0.08],
        [-0.19, 0.28, 0.05],
      ],
      colors: ["#E8492A", "#F2A93B", "#1FB7A6"],
      speed: 0.085,
    },
  } satisfies Workstation,
} as const satisfies Tour;
