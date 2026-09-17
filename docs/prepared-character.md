# Conny's prepared character

The homepage uses the supplied purple-shirt character, including its wink, smile, and peace sign. The existing six-stop tour, illustrated stickers, workstation, typography, and native scrolling remain the website's structure.

## Asset and motion

`public/3d/conny-character.glb` contains 179,975 triangles and occupies 5,169,664 bytes. The supplied original contains 2,032,534 triangles and occupies 63,370,676 bytes. The derivative reduces transfer size by 91.8% and retains the original 2048px color atlas.

The editable source is `assets/3d/conny-character.blend`. It has two bones, `Root` and `Head`, with a neck blend. The shirt, raised arm, and peace-sign hand remain fixed. Skin, hair, and shirt have distinct material roughness and share one image. The GLB uses `EXT_meshopt_compression`.

The prepared adapter applies small head rotations relative to the authored pose. Pointer response settles in 280ms. Yaw is bounded to 0.05 radians, pitch to 0.032, and roll to 0.006. The renderer rests when movement ends.

The original is one welded mesh with painted eyes. This version preserves the authored expression and has no independent eye tracking or blink animation. The scheduler reads that capability and creates no blink timer. Adding a separate eye requires actual socket and eyeball authoring, followed by new visual checks. The old bust's texture projection and generated eyelid shaders do not apply to this model.

`ConnyShirt` is the exact decal target. All character meshes participate in hit occlusion, so the hand can block a sticker behind it. The `focus_face`, `focus_torso`, and `focus_hand` nodes record subject locations. `content/tour.ts` owns camera composition and focal points.

## Preparation choice

Neutral front, oblique, side, back, and clay views established that the supplied model was usable. Camera-left oblique views place the hand across the mouth, so portrait framing favors front and camera-right views.

Global reductions to 40,000, 80,000, 140,000, and 240,000 triangles were compared. The smaller versions visibly flattened the nose, neck, and fingers. A regional reduction gave the skin and hand 80,000 triangles, hair 80,000, and shirt 20,000. It preserved the face better than the global 240,000-triangle candidate. The simplifier locks region boundaries to prevent cracks. Blender removes 13 degenerate triangles on import.

Simplification regions use linearized atlas colors and position. Material assignment uses Blender's sRGB image samples on the reduced triangles. The material counts therefore differ from the simplification budgets. Both stages are deterministic and their output was visually compared.

The preparation changes topology and material response. It does not regenerate the person, alter the wink or hand pose, or increase the color texture's resolution.

## Rebuild the asset

Use Node dependencies from `npm ci` and Blender 5.2.2. Supply the original GLB as an external input. It is not committed with the website.

```bash
node scripts/3d/prepare-character.mjs /path/to/original.glb /tmp/conny-preparation 240000 --regions=80000,80000,20000
blender --background --factory-startup --python scripts/3d/rig-character.py -- /tmp/conny-preparation/character-regional-80000-80000-20000-raw.glb /tmp/conny-rig
```

Inspect the generated GLB and Blender source before copying them into `public/3d/` and `assets/3d/`. Recalibrate sticker positions if the source geometry changes. Refresh the poster and Job Search still with `scripts/3d/render-stills.mjs`.

The supplied original SHA-256 is `bea84ceebee919a012cf1a7f99b3dd11159cb16db6c8f9df2b43f8ea92049559`. The preparation reports record candidate hashes, achieved triangle counts, and meshoptimizer appearance errors. Those errors combine geometry, UV, and normal differences; they are not maximum surface-distance measurements.

The original model came from the user's handoff and its existing Meshy V7 generation. No new paid generation ran in this iteration. Source selfies and private handoff documents remain outside the repository. No personal assets from the reference résumé site were copied.

## Verify changes

The [verification report](prepared-character-verification.md) records the reviewed desktop and phone views, measured checks, and remaining limits.

Run the repository checks and start its production server. Set `TOUR_URL` to that server and `PLAYWRIGHT_MODULE` if Playwright is installed outside the project.

```bash
npm run verify
TOUR_URL=http://localhost:3000 node scripts/verify/tour.mjs
TOUR_URL=http://localhost:3000 node scripts/verify/decals.mjs
TOUR_URL=http://localhost:3000 node scripts/verify/prepared-character.mjs
TOUR_URL=http://localhost:3000 node scripts/verify/motion.mjs
```

Run the timing script after the other captures finish. It reports bone-pose texture updates separately from asset uploads. Three stores changing skeletal matrices in that small texture, so those updates are expected during movement.

`scripts/verify/portrait.mjs` remains the verifier for the legacy bust. It does not certify this character. Browser screenshots and head deformation checks complement the build; responsive Chrome checks do not certify physical phone GPU performance.
