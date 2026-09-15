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
 * Sticker positions and normals come from raycasts against public/3d/conny-bust.glb.
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
    /** Used instead of position, target, and fov when the viewport is taller than wide. */
    phone: {
      position: Vec3;
      target: Vec3;
      /** A portrait crop is narrow, so a wide subject needs its own angle. */
      fov: number;
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
  /**
   * Yaw in degrees, applied on load. The cameras assume the face looks down
   * +z; this is the correction when a mesh was authored facing another way.
   */
  yaw: number;
  /** Still of the first stop. Shown for prefers-reduced-motion, no JavaScript, and while the GLB loads. */
  poster: string;
  posterAlt: string;
  /**
   * Paints the whole mesh one flat clay color. Leave it out when the GLB
   * carries a baked texture worth keeping, as Conny's bust does.
   */
  material?: {
    color: string;
    roughness: number;
  };
  /** Forced onto whichever material ends up on the mesh, so clay stays clay. */
  finish: {
    roughness: number;
    metalness: number;
  };
  credit: {
    text: string;
    /** Shown instead of `text` on a phone, where the line gets one row. */
    short: string;
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
    "Meet Junyi (Conny) Zhou: clinical AI, computational biology, and agent systems. Explore the projects in an interactive 3D tour.",
  model: {
    src: "/3d/conny-bust.glb",
    yaw: 0,
    poster: "/3d/poster.jpg",
    posterAlt:
      "A soft clay bust of Conny in a sand-colored knit sweater, with thick dark hair and a warm smile, and round stickers across the sweater.",
    finish: {
      roughness: 0.92,
      metalness: 0,
    },
    credit: {
      text: "Junyi (Conny) Zhou · Harvard / Wyss · Boston, MA",
      short: "Conny Zhou · Boston, MA",
    },
  },
  stops: [
    {
      id: "start",
      tag: "Start",
      eyebrow: "Health data science · Harvard / Wyss",
      title: "Hi, I’m Conny.",
      body: "I build AI tools for clinical training, computational biology, and research that keeps moving. Scroll to meet the projects, or choose a stop above.",
      links: [
        { href: "/hub", label: "More about me" },
        { href: "https://github.com/JunyiZhou-Conny", label: "GitHub" },
      ],
      camera: {
        position: [1.187, 0.978, 2.434],
        target: [0.288, 0.5, -0.14],
        fov: 32,
        phone: {
          position: [0.627, 0.787, 2.513],
          target: [0, 0.4, 0],
          fov: 38,
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
        position: [-0.987, 0.841, 2.236],
        target: [0.274, 0.5, 0.142],
        fov: 30,
        phone: {
          position: [-0.947, 0.748, 2.406],
          target: [-0.1, 0.36, 0.08],
          fov: 36,
        },
      },
      tint: "#F7DDC7",
    },
    {
      id: "cells",
      tag: "Cells",
      eyebrow: "speciesOT, in progress",
      title: "Mouse cells in. Human cells out.",
      body: "Exploring how optimal transport can map mouse cells to human cells in a shared autoencoder latent space. A command-line toolkit brings model comparison, scorecards, and cluster workflows together.",
      links: [
        { href: "https://github.com/JunyiZhou-Conny/speciesOT", label: "GitHub" },
      ],
      camera: {
        position: [-1.351, 0.968, 1.945],
        target: [0.112, 0.5, 0.277],
        fov: 30,
        phone: {
          position: [-1.302, 0.791, 2.401],
          target: [-0.18, 0.32, 0.1],
          fov: 34,
        },
      },
      tint: "#DCEBE6",
    },
    {
      id: "jobs",
      tag: "Job search",
      eyebrow: "Job Search OS, running since July 2026",
      title: "An application workflow with a memory.",
      body: "Cursor defines the policy. Polar Browser carries out the workflow. GitHub records the changes, and Google Sheets tracks each run. Application submission follows explicit rules.",
      links: [
        {
          href: "https://github.com/JunyiZhou-Conny/job-search-2026-2027-starter",
          label: "GitHub",
        },
      ],
      camera: {
        position: [0.51, 0.961, 2.64],
        target: [-0.047, 0.42, 0.136],
        fov: 36,
        phone: {
          position: [-0.081, 0.881, 3.063],
          target: [-0.61, 0.18, 0.473],
          fov: 40,
        },
      },
      tint: "#DCE6F0",
    },
    {
      id: "loops",
      tag: "Loops",
      eyebrow: "scGen / CellOT autoresearch",
      title: "Research that keeps running.",
      body: "A loop that submits experiments, watches results, and plans the next run on FASRC Cannon. 338 experiments over 79.3 cluster hours: 318 completed and 20 handled failures.",
      links: [
        {
          href: "https://github.com/JunyiZhou-Conny/scgen-cellot-autoresearch",
          label: "GitHub",
        },
      ],
      camera: {
        position: [1.2, 1.536, 1.78],
        target: [0.249, 0.58, -0.168],
        fov: 30,
        phone: {
          position: [1.201, 1.639, 2.299],
          target: [0.08, 0.4, 0],
          fov: 36,
        },
      },
      tint: "#DBDAEA",
    },
    {
      id: "off-hours",
      tag: "Off hours",
      eyebrow: "Beyond the projects",
      title: "Let’s stay in touch.",
      body: "Curious about the work, or building something related? Find me and the projects here.",
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
        position: [1.536, 0.767, 1.823],
        target: [0.27, 0.44, -0.153],
        fov: 32,
        phone: {
          position: [1.159, 0.735, 1.978],
          target: [0.04, 0.42, 0.04],
          fov: 38,
        },
      },
      tint: "#F2ECE2",
    },
  ] satisfies readonly TourStop[],
  /**
   * Story cues, not scatter. They sit on the sweater like enamel pins, and
   * none of them go on the face: the face is the identity, and a sticker on a
   * cheek reads as a rash rather than a badge. The Job Search stop carries no
   * sticker on purpose, because its cue is the workstation.
   * Positions are raycasts against public/3d/conny-bust.glb in the fitted
   * frame, captured with /?place=1.
   */
  stickers: [
    {
      id: "pulse",
      kind: "work",
      label: "Heart with a pulse line sticker",
      image: "/3d/stickers/pulse.svg",
      position: [-0.173, 0.229, 0.074],
      normal: [-0.241, 0.469, 0.85],
      size: 0.072,
      rotation: 6,
    },
    {
      id: "dna",
      kind: "work",
      label: "DNA helix sticker",
      image: "/3d/stickers/dna.svg",
      position: [-0.312, 0.149, 0.07],
      normal: [-0.254, 0.176, 0.951],
      size: 0.072,
      rotation: -8,
    },
    {
      id: "hub",
      kind: "work",
      label: "Terminal sticker that reads ./hub",
      image: "/3d/stickers/hub.svg",
      position: [-0.13, 0.094, 0.122],
      normal: [-0.098, 0.169, 0.981],
      size: 0.07,
      rotation: 4,
    },
    {
      id: "chip",
      kind: "work",
      label: "GPU chip sticker",
      image: "/3d/stickers/chip.svg",
      position: [0.321, 0.253, -0.046],
      normal: [0.433, 0.901, -0.034],
      size: 0.07,
      rotation: -14,
    },
    {
      id: "bike",
      kind: "hobby",
      label: "Bicycle sticker",
      image: "/3d/stickers/bike.svg",
      position: [0.309, 0.18, 0.062],
      normal: [0.224, 0.306, 0.926],
      size: 0.072,
      rotation: 7,
    },
    {
      id: "headphones",
      kind: "hobby",
      label: "Headphones sticker",
      image: "/3d/stickers/headphones.svg",
      position: [0.387, 0.118, 0.056],
      normal: [0.519, 0.033, 0.854],
      size: 0.07,
      rotation: -5,
    },
  ] satisfies readonly Sticker[],
  workstation: {
    stopId: "jobs",
    position: [-0.72, 0, 0.5],
    rotation: 14,
    scale: 1.02,
    screen: "/3d/workstation/screen.svg",
    tiles: [
      {
        id: "cursor",
        label: "Cursor, the thinking desk",
        image: "/3d/workstation/cursor.svg",
        position: [-0.25, 0.435, 0.02],
        size: 0.135,
        rotation: -7,
        phase: 0,
      },
      {
        id: "polar",
        label: "Polar Browser, the action layer",
        image: "/3d/workstation/polar.svg",
        position: [-0.088, 0.522, 0.03],
        size: 0.135,
        rotation: 4,
        phase: 1.3,
      },
      {
        id: "github",
        label: "GitHub, the system state",
        image: "/3d/workstation/github.svg",
        position: [0.088, 0.522, 0.03],
        size: 0.135,
        rotation: -4,
        phase: 2.5,
      },
      {
        id: "sheets",
        label: "Google Sheets, the tracker",
        image: "/3d/workstation/sheets.svg",
        position: [0.25, 0.435, 0.02],
        size: 0.135,
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
