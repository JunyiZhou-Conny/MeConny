# Cinematic tour reference

The homepage presents six distinct camera compositions around Conny and the Job Search workstation. Native document scroll drives the sequence. The written hub at `/hub` keeps its existing layout and styling.

## Composition and typography

The tour uses warm brown, terracotta, pine, blue, and violet grounds with light text. Fraunces sets the headings. IBM Plex Sans sets body copy, and IBM Plex Mono sets counters. Corner viewfinder marks, marginal labels, and grain frame the scene.

Copy sits directly over the scene beside a thin vertical rail. `.tour-card` remains the internal class name, but the live annotation has no filled card, rounded container, or shadow. Phone layouts put the copy below the main subject with a soft background gradient for contrast.

| Stop | Main subject |
| --- | --- |
| Start | An establishing portrait of Conny |
| Clinical AI | The heart and stethoscope sticker at the collar |
| Cells | A closer view of the DNA and cells sticker |
| Job Search OS | The isolated desk, laptop, tool tiles, and running loop |
| Loops | The research chip and chart ribbon sticker |
| Off hours | A return to Conny's portrait and contact links |

The bust fades out as the Job Search workstation becomes visible. At the settled Job Search stop, the workstation has the frame to itself. The final portrait provides a pause after the project close-ups.

## Cameras and light

`content/tour.ts` defines every stop's desktop and phone camera. `camera.target` controls composition. `camera.focalPoint` identifies the subject that remains sharp, independently of the copy's space in the frame. Both viewport layouts use that same model-space focal point. The renderer projects its camera-relative position onto the camera's forward direction to set the depth-of-field distance.

`Tour.tsx` interpolates camera position, target, focal point, and per-stop blur settings. Three.js `BokehPass` supplies depth of field. Restrained `UnrealBloomPass` and `OutputPass` complete the image. An HDR environment lights the model without replacing each stop's background tint. A directional key adds shape. `RoomEnvironment` remains the fallback if the HDR cannot load.

## Sticker assets and navigation

The six active textures are 512 × 512 WebP files with transparency and irregular cream borders. Codex generated the original illustrations with the OpenAI image tool on September 16, 2026, then optimized the transparent images for delivery. The final DNA illustration was regenerated to remove an unwanted halo.

| File under `public/3d/stickers/` | Illustration | `stopId` |
| --- | --- | --- |
| `pulse-illustrated.webp` | Heart with a stethoscope | `clinical` |
| `dna-illustrated.webp` | DNA helix and cells | `cells` |
| `hub-illustrated.webp` | Terminal | `start` |
| `chip-illustrated.webp` | Research chip with a chart ribbon | `loops` |
| `bike-illustrated.webp` | Bicycle | `off-hours` |
| `headphones-illustrated.webp` | Headphones | `off-hours` |

Stickers remain on the sweater. Each interactive decal has an explicit `stopId`. Pointer raycasts show a hand cursor and destination title, and a click navigates to that stop. Equivalent links support keyboard navigation. The retained SVG generator produces the older simple icons, not these illustrations. Workstation textures remain SVGs.

## HDR source

`public/3d/studio-environment.hdr` is the 1K HDR version of [Potsdamer Platz by Greg Zaal](https://polyhaven.com/a/potsdamer_platz), obtained from Poly Haven's official download CDN. The asset uses [CC0](https://polyhaven.com/license). The local file is 1,540,678 bytes.

## Character constraints

`conny-bust.glb` has 15,000 triangles, one combined mesh, and one baked 1024px WebP base-color atlas. Meshopt compresses its geometry. The eyes and much of the facial detail are painted. The model has no skeletal rig or animation clips.

`character-material.ts` repairs the baked ear projection through a localized shader mask. It mirrors the clean opposite ear's atlas projection into the affected region while retaining the mesh's normals and lighting. The correction is calibrated to this exact GLB and does not modify its geometry or atlas. A replacement asset must disable or recalibrate the correction, even if it reuses the filename.

## Static presentation

Reduced motion, disabled JavaScript, an unavailable WebGL context, and unsupported floating-point render targets use the poster and all six stacked annotations. Job Search includes its own workstation still. The loading overlay fades after the live scene is ready. URLs retain a hash for each stop, and browser history remains available.

## Verification for this iteration

`npm run verify` passed ESLint, TypeScript, and the production build. The production Chrome suite passed 28 checks. After camera, navigation-label, and compact-layout refinements, five affected checks passed. The final short-phone contrast change passed its focused check and runtime-error assertion. Checks include all six stops on 1440 × 900 and 390 × 844 viewports, native scrolling, initial Start and deep links, reload, Back/Forward, delayed assets, failed HDR/model loading, unavailable float render targets, context loss, reduced motion, disabled JavaScript, and keyboard navigation. A separate UI check clicked the visible heart decal and reached Clinical.

An independent agent reviewed all twelve 1280 × 720 and 390 × 844 compositions. A separate code review found the unsupported render-target issue; the implemented capability check and fault-injection regression resolved it. Both reviews used the available model family. Screenshot checks establish composition, not mobile GPU performance or identity likeness.
