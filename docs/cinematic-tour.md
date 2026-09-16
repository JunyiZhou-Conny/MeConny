# Cinematic tour reference

The homepage presents six distinct camera compositions around Conny and the Job Search workstation. Native document scroll drives the sequence. The written hub at `/hub` keeps its existing layout and styling.

## Composition and typography

The tour uses warm brown, terracotta, pine, blue, and violet grounds with light text. Fraunces sets the headings. IBM Plex Sans sets body copy, and IBM Plex Mono sets counters. Corner viewfinder marks, marginal labels, and grain frame the scene.

Copy sits directly over the scene beside a thin vertical rail. `.tour-card` remains the internal class name, but the live annotation has no filled card, rounded container, or shadow. Phone layouts put the copy below the main subject with a soft background gradient for contrast.

| Stop | Main subject |
| --- | --- |
| Start | An establishing portrait of Conny |
| Clinical AI | The heart and stethoscope sticker at the collar |
| Cells | DNA and cells with recognizable facial context |
| Job Search OS | The desk, laptop, tool tiles, and loop beside Conny |
| Loops | A facial and collar close-up around the research chip |
| Off hours | A frontal portrait and contact links |

Start gives the head and shoulders air. Clinical and Cells move closer while retaining the face. The Job Search desk appears beside Conny in the same lit space. Loops is the tightest detail composition. The final portrait faces the visitor more directly.

## Cameras and light

`content/tour.ts` defines every stop's desktop and phone camera. `camera.target` controls composition. `camera.focalPoint` identifies the subject that remains sharp, independently of the copy's space in the frame. Both viewport layouts use that same model-space focal point. The renderer projects its camera-relative position onto the camera's forward direction to set the depth-of-field distance.

`tour-motion.ts` defines a complete camera pose, including position, target, focal point, field of view, blur, tint, and workstation presence. A requested destination owns the navigation, copy, counter, and hash immediately. The displayed pose travels directly from its current position to that destination in a single 520 ms cubic ease-out. New input replaces the current transition. Elapsed wall time determines progress, so a slow frame does not prolong settling.

The scene renders on demand. Camera motion, decal hover, and finite facial events request frames. The body has no perpetual sway and pointer movement does not move the camera. The workstation clock advances during travel, then holds its pose. Native document scrolling remains available. The document does not use CSS scroll snapping. A partial gesture can stop between authored views; the camera settles at that intermediate pose and the nearest stop owns the annotation. Navigation links still land at exact stops.

Three.js `BokehPass` supplies depth of field. Restrained `UnrealBloomPass` and `OutputPass` complete the image. Drawing buffers are capped at device ratio 1.5 and two million pixels; DOM text retains the browser's resolution. Textures and all scene/pass variants are warmed behind the loader before reveal.

The HDR environment lights the model without replacing each stop's background tint. Warm key and rim lights, a restrained cool fill, and a hemisphere fill preserve shape. `RoomEnvironment` remains the fallback if the HDR cannot load.

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

Stickers remain on the sweater. Each interactive decal has an explicit `stopId`. Alpha-aware pointer raycasts ignore transparent image margins. Hover lifts the decal along its surface normal, scales it to 1.06, shows a hand cursor, and projects a destination label beside it. Click or tap navigates to that stop. Navigation clears the previous hover state. Equivalent links support keyboard navigation. The retained SVG generator produces the older simple icons, not these illustrations. Workstation textures remain SVGs.

## HDR source

`public/3d/studio-environment.hdr` is a 512 × 256 derivative of the 1K HDR version of [Potsdamer Platz by Greg Zaal](https://polyhaven.com/a/potsdamer_platz), obtained from Poly Haven's official download CDN. The asset uses [CC0](https://polyhaven.com/license). The local file is 397,385 bytes, reduced from 1,540,678 bytes. `scripts/3d/downsample-hdr.mjs` averages 2 × 2 linear-light pixels and writes RGBE scanlines. Round-trip quantization error is 0.19% relative to the averaged linear RGB; radiance above 1 is preserved.

## Character constraints

`conny-bust.glb` has 15,000 triangles, one combined mesh, and one baked 1024px WebP base-color atlas. Meshopt compresses its geometry. The eyes and much of the facial detail are painted. The model has no skeletal rig or animation clips.

The calibrated `character-attention.ts` helper derives a 25,200-triangle mesh at load time. Local eyelid subdivision provides a named `connyBlink` position and normal morph. A one-time projection of the original eye texture supports small independent gaze offsets across fragmented UV islands. A malformed cheek triangle receives three UV coordinates from coincident healthy vertices on a temporary geometry clone before derivation. The source GLB and its atlas remain unchanged. This is a bounded adaptation of the original model, not a full anatomical eye or facial rig.

Head rotation fades from zero below fitted y0.31 to full above y0.49, leaving the sweater and decals still. The same deformation runs in the depth-of-field pass. `attention-motion.ts` handles 140ms eye response, 280ms head response, and 240ms blinks separated by 5.2–7.8 seconds. Hidden pages pause the blink timer; reduced motion uses the static presentation.

The helper checks the original vertex/index counts and required attributes before applying this calibration. These checks are not a content hash. A replacement model requires recalibration or a separate rig, even if it has the same filename and counts. The original asset SHA-256 is `69e2e3ff2d3d2c74aa03f3047329ef7428c1c5c9ceb296b2a7840d0b2022185e`.

`character-material.ts` repairs the baked ear projection through a localized shader mask. It mirrors the clean opposite ear's atlas projection into the affected region while retaining the mesh's normals and lighting. The correction is calibrated to this exact GLB and does not modify its geometry or atlas. A replacement asset must disable or recalibrate the correction, even if it reuses the filename. A separate height-and-color mask raises the near-black hair albedo and reduces its roughness while preserving the skin finish.

## Static presentation

Reduced motion, disabled JavaScript, an unavailable WebGL context, and unsupported floating-point render targets use the poster and all six stacked annotations. Job Search includes its own workstation still. The loading overlay fades after the live scene is ready. URLs retain a hash for each stop, and browser history remains available.

## Verification of this iteration

`npm run verify` passed lint, TypeScript, and the production build. The production Chrome behavior suite passed 32 checks, including all six desktop and phone views, partial native scrolling, rapid retargeting, first-frame navigation during GPU warm-up, delayed JavaScript, history, keyboard navigation, reduced motion, context loss, denied floating-point targets, and failed assets. Seven sticker checks passed hover/click/touch navigation and actual 1.06 scale and 0.004 surface-normal lift.

The portrait verifier inspected actual renderer frames and uniforms. It passed independent gaze with a fixed camera, separate head response, unchanged torso morph positions, complete natural blinks at frontal/Start/Clinical angles, and a return to quiet rendering. Fourteen captures support those checks. The original GLB hash is unchanged; the three-UV cheek repair and geometry disposal were verified separately.

Three final motion repetitions passed every gate on Chrome with Apple M1/ANGLE Metal, a 1280 × 720 viewport at device ratio 2, and a capped 1885 × 1060 drawing buffer. Wheel-event-to-first-changed-camera callback measured 70.7–78.7 ms; settling measured 597.4–614.2 ms, versus 1,161.9 ms in the earlier baseline. Transition frame-gap p95 was 17.4–17.6 ms, with a worst gap of 72.8 ms and no gap over 100 ms. Idle camera/torso transforms stayed fixed. Brief blink bursts occupied at most 4.6% of the six-second idle observations. Retarget mismatches, post-load shader compilations, texture uploads, and runtime errors were zero.

A plain native-scroll control isolated additional delay from CSS proximity snapping. Removing it preserves fractional scroll positions and exact navigation links. The partial-scroll regression first reproduced the old snap-back, then verified a 90px scroll, the corresponding intermediate camera, consistent metadata, and quiet rendering after the fix. Extra wheel sampling was rejected after its passing experiment showed no causal benefit.

Earlier variants produced cold timing outliers of 100.8–148.5 ms; these failures are retained in the local evidence. The final three passes do not guarantee timing on every device. Baseline settling used a 0.001 pose tolerance, while the final check uses transition completion. The drawing buffer and derived geometry also changed. These measurements record render-callback timing, not GPU completion or screen presentation. Phone checks use responsive Chrome viewports, not physical phone hardware.

Independent code and visual reviewers inspected the implementation, twelve production layouts, and natural portrait frames using the available model family. Their findings led to fixes for the warm-up reveal race, depth-material adapter, attention startup, phone composition, and cheek texture. No material review finding remains. The rerunnable scripts are documented in `docs/homepage-tour.md`.
