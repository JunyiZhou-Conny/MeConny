# Cloud polish review — 15 September 2026

This work continues PR #6 at `185b7290490cbb08bb4dbef77280585011730c78`.
The working branch is `codex/conny-character-polish`, based on
`cursor/homepage-3d-tour-145b`. Review this delta before landing the existing
PR stack. PR #4 remains parked; no production merge is part of this work.

## Homepage changes

- Introduce Conny and the work in the opening card; remove stale Einstein and
  model-production language from visitor-facing metadata and the footer.
- Preserve all six stops, public project facts, the Job Search desk, camera
  paths, sweater stickers, and the existing default character and poster.
- Give the page one `h1`; make mobile stop navigation a separate horizontally
  scrollable row and keep the active tag in view. Constrain live cards on short
  screens while leaving static cards expanded.
- Generate a warm social sharing image from the existing character poster.
  Use the public domain for metadata when no site URL override is provided.

## Character runtime

The loader now handles a character exported as several meshes. It selects
`ConnyBust` for sweater decals when available, otherwise the mesh with the
largest world-space extent. It fits the complete character to the existing
camera scale and applies the matte finish to every mesh without replacing its
texture unless a material override is configured.

Authored glTF animations play through `AnimationMixer`; sticker placement mode
leaves them paused. The current default GLB has painted eyes and no blink clip,
so this runtime change does not claim to add blinking to that model.

Empty or invalid models and context loss return to the static page. Resource
cleanup includes every mesh, material texture, and skeleton, including a model
that finishes loading after the component has been disposed.

## Blender work

The supplied `.blend` opens and renders in Blender 5.2.1 LTS in the cloud.
The supplied smiling selfie and style reference are available. A separate
experimental character adds two eye meshes and an authored blink animation.
It is a review candidate, not the default website asset: visual acceptance and
in-browser checks must precede a swap. Reference photos are not added to this
public repository.

## Verification and remaining checks

Passed on the production build:

- `npm run verify` (ESLint and Next.js build); final ESLint rerun is clean.
- `/` returns 200 with six server-rendered cards and exactly one `h1`.
- `/3d` returns 307 to `/`.
- `/hub` returns 200 with no tour markup; its source files are unchanged.
- The default GLB returns 200, has a glTF header, and remains 230,700 bytes.
- The Open Graph route returns a 1200 × 630 PNG; the rendered image was inspected.

The managed browser blocks the local preview address. The existing Vercel
preview also requires sign-in. **Desktop and mobile browser/WebGL behavior has
not been verified for this delta.** HTTP checks establish server output only;
they do not establish live mode, motion preference behavior, fragment scroll
positions, animation, or context-loss recovery.

Before merging, use the existing procedure in `docs/homepage-tour.md` at
1440 × 900 and 390 × 844. Check live mode, all six stops, `/#jobs`, `/3d#cells`,
native scroll, tag navigation, short-screen cards, reduced motion, no JavaScript,
failed model loading, and context loss. If a new character is accepted, also
retune and verify cameras, decals, and the poster against that exact GLB.
