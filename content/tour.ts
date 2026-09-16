/**
 * Coordinates use the fitted model space. The bust is one unit tall, its base
 * sits at y = 0, its footprint is centered on x and z, and its face looks
 * down +z. Desktop cameras reserve the right side for copy. Phone cameras
 * frame the scene above the copy.
 *
 * Sticker positions and normals come from raycasts against conny-bust.glb.
 * Open /?place=1 and click the bust to print a calibrated placement entry.
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
  still?: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  camera: {
    position: Vec3;
    target: Vec3;
    /** Vertical field of view in degrees. */
    fov: number;
    focalPoint?: Vec3;
    focus?: number;
    aperture?: number;
    maxblur?: number;
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
  stopId?: string;
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
      "A soft clay bust of Conny in a sand-colored knit sweater, with thick dark hair and a warm smile, and illustrated paper stickers across the sweater.",
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
        position: [1.03, 0.82, 2.05],
        target: [0.35, 0.5, 0],
        fov: 34,
        focalPoint: [0, 0.68, 0.14],
        aperture: 0.01,
        maxblur: 0.009,
        phone: {
          position: [0.3, 0.8, 2.5],
          target: [0, 0.46, 0],
          fov: 40,
        },
      },
      tint: "#765343",
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
        position: [-0.55, 0.68, 1.48],
        target: [0.26, 0.48, 0.02],
        fov: 33,
        focalPoint: [-0.12, 0.235, 0.086],
        aperture: 0.012,
        maxblur: 0.009,
        phone: {
          position: [-0.5, 0.72, 2.4],
          target: [-0.05, 0.25, 0.02],
          fov: 39,
        },
      },
      tint: "#7D443D",
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
        position: [-0.68, 0.65, 1.02],
        target: [0.22, 0.25, 0.04],
        fov: 34,
        focalPoint: [-0.19, 0.12, 0.105],
        aperture: 0.018,
        maxblur: 0.009,
        phone: {
          position: [-0.6, 0.65, 1.45],
          target: [-0.1, 0.14, 0.04],
          fov: 40,
        },
      },
      tint: "#405D54",
    },
    {
      id: "jobs",
      tag: "Job search",
      eyebrow: "Job Search OS, running since July 2026",
      title: "An application workflow with a memory.",
      body: "Cursor defines the policy. Polar Browser carries out the workflow. GitHub records the changes, and Google Sheets tracks each run. Application submission follows explicit rules.",
      still: {
        src: "/3d/job-search-still.webp",
        alt: "The Job Search workstation: a small desk with a lit laptop, floating Cursor, Polar Browser, GitHub, and Google Sheets tiles, and colored dots on a loop connecting the tools.",
        width: 1100,
        height: 700,
      },
      links: [
        {
          href: "https://github.com/JunyiZhou-Conny/job-search-2026-2027-starter",
          label: "GitHub",
        },
      ],
      camera: {
        position: [0.28, 0.88, 2.55],
        target: [0.17, 0.45, 0.1],
        fov: 36,
        focalPoint: [-0.26, 0.4, 0.2],
        aperture: 0.012,
        maxblur: 0.009,
        phone: {
          position: [0.04, 1.03, 4.1],
          target: [-0.22, 0.24, 0.14],
          fov: 42,
        },
      },
      tint: "#3F5268",
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
        position: [0.5, 0.59, 0.88],
        target: [0.28, 0.4, 0.04],
        fov: 32,
        focalPoint: [0.16, 0.235, 0.075],
        aperture: 0.018,
        maxblur: 0.009,
        phone: {
          position: [0.52, 0.63, 1.35],
          target: [0.1, 0.2, 0.05],
          fov: 40,
        },
      },
      tint: "#594C65",
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
        position: [0, 0.68, 2.1],
        target: [0.34, 0.52, 0],
        fov: 33,
        focalPoint: [0, 0.65, 0.12],
        aperture: 0.012,
        maxblur: 0.009,
        phone: {
          position: [0, 0.68, 2.3],
          target: [0, 0.43, 0],
          fov: 40,
        },
      },
      tint: "#67503E",
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
      stopId: "clinical",
      kind: "work",
      label: "Heart with a pulse line sticker",
      image: "/3d/stickers/pulse-illustrated.webp",
      position: [-0.12, 0.235, 0.086],
      normal: [-0.222, 0.357, 0.907],
      size: 0.14,
      rotation: 6,
    },
    {
      id: "dna",
      stopId: "cells",
      kind: "work",
      label: "DNA helix sticker",
      image: "/3d/stickers/dna-illustrated.webp",
      position: [-0.19, 0.12, 0.105],
      normal: [-0.192, 0.323, 0.927],
      size: 0.17,
      rotation: -8,
    },
    {
      id: "hub",
      stopId: "start",
      kind: "work",
      label: "Illustrated terminal sticker",
      image: "/3d/stickers/hub-illustrated.webp",
      position: [-0.065, 0.09, 0.122],
      normal: [-0.021, 0.139, 0.99],
      size: 0.09,
      rotation: 4,
    },
    {
      id: "chip",
      stopId: "loops",
      kind: "work",
      label: "GPU chip sticker",
      image: "/3d/stickers/chip-illustrated.webp",
      position: [0.16, 0.235, 0.075],
      normal: [0.222, 0.412, 0.884],
      size: 0.15,
      rotation: -14,
    },
    {
      id: "bike",
      stopId: "off-hours",
      kind: "hobby",
      label: "Bicycle sticker",
      image: "/3d/stickers/bike-illustrated.webp",
      position: [0.24, 0.125, 0.095],
      normal: [0.231, 0.259, 0.938],
      size: 0.145,
      rotation: 7,
    },
    {
      id: "headphones",
      stopId: "off-hours",
      kind: "hobby",
      label: "Headphones sticker",
      image: "/3d/stickers/headphones-illustrated.webp",
      position: [0.1, 0.1, 0.118],
      normal: [0.07, 0.176, 0.982],
      size: 0.1,
      rotation: -5,
    },
  ] satisfies readonly Sticker[],
  workstation: {
    stopId: "jobs",
    position: [-0.52, 0, 0.38],
    rotation: 14,
    scale: 0.82,
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
