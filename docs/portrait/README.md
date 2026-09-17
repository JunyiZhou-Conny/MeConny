# Open-eye portrait

The production portrait shows Conny with both eyes open and four stickers projected onto the cheeks. The smile, purple shirt, peace sign, and reference scene styling remain. The four sticker focus anchors and research camera arc are calibrated to this new face and forward hand. Conny selected this version for production on September 17, 2026. The prior wink release remains available in Git history at `611b0970c416cd235afbe8612a2e8e30c4a13b59`.

The final scene is 6,283,724 bytes: 185,765 character triangles and 524 decal triangles. The story stickers follow Clinical AI/pulse, Biology/dna, Job Search/hub, and Research/chip. Placement is defined in `web/scripts/portrait-calibration.json`; eyes and lips stay clear. The fit scale is 1.73 after comparing it with 1.65 in the actual homepage.

## Sources and preparation

One Meshy 7 image-to-3D job ran through the connected Fal account after the user approved the reference and quoted $0.80 cost. The original 21,704,520-byte generated GLB remains in the local task's `work/live-site-next/portrait/` archive. `assets/portrait/reference.jpg` preserves the approved reference, and `assets/portrait/conny-character.glb` is the prepared input for repeatable sticker placement.

The generated normal and roughness maps exaggerated triangular surface patches. The prepared input uses smoothed normals, roughness 0.76, metalness 0, and a 2048-pixel WebP color map. Compression retains all triangles; maximum position error is 0.000009265 model heights. The prepared asset is 5,956,512 bytes. Geometry, texture, generation, and output hashes are recorded in [provenance.json](provenance.json).

The eyes are part of a static textured mesh. There are no independent eyeballs, eyelid controls, blinks, or gaze tracking. Small generated polygonal contours near the nose and mouth and dark seams around the collar/hand remain visible in close inspection. Those areas have not been hand-retopologized.

## Rebuild face placement

Install the existing frontend dependencies with `npm ci --prefix web`. Obtain the original camera scene from [the immutable upstream commit](https://github.com/dayinji/sen-3d-resume/blob/c9a9fe373cde72c77ff7f2dabde17fb79dce89b3/web/public/models/me.glb). Its SHA-256 must be `77e8cf1ef81943c81cbe6f1c5f65048ccaecc4f001f12fc60857d3f38e4229ef`. The composer copies only its camera, focus anchors, and animation carrier; it rejects previously composed scenes as reference inputs.

From the repository root:

```bash
node web/scripts/build-portrait-scene.mjs \
  /path/to/upstream-me.glb \
  assets/portrait/conny-character.glb \
  web/public/stickers \
  /path/to/intermediate-portrait.glb
node web/scripts/calibrate-portrait-camera.mjs \
  /path/to/intermediate-portrait.glb \
  /path/to/reviewed-portrait.glb \
  web/scripts/portrait-calibration.json
```

The composer’s optional final argument selects another calibration JSON. Use the same calibration for the separate camera postpass. Both scripts require a new output path. Source files are never overwritten. The composer verifies the inherited scene data, character streams, and image invariants, then writes a companion report. The camera postpass verifies the explicit portrait corrections and preserves unrelated scene data. The installed script and selected calibration reproduced the committed scene byte for byte.

Review the result before replacing `web/public/models/me.glb` and its expected hash in `docs/reference/scene-contract.json`. Keep lens, lighting, and unrelated camera stops intact when comparing portrait options. This portrait adds mobile framing in `Scene.tsx`, enabled by scene metadata; the prior production scene source hash is retained in the contract. Record deliberate camera/focus corrections in calibration data and review the moving result. Run `npm run verify` and the desktop/phone browser suite described in [publication.md](../publication.md).

Face stickers are real shallow projected geometry attached to the character. They use the existing sticker artwork; Blender is not required to adjust their placement. Direct eyelid or topology editing would be a separate modeling task.

## Why the portrait needs its own focus calibration

The inherited research camera passes behind the new forward peace-sign hand. Its calibrated correction raises that part of the camera path. The inherited biology focus anchor also lies on a different depth plane from the new cheek, which blurred the DNA sticker. Its calibrated focus follows the actual sticker surface. The prior wink scene remains available at the production baseline commit recorded in the contract.

## Phone framing

The inherited camera composition puts face stickers behind the phone story cards. Portrait scene metadata identifies the four stickers and supplies a 12-pixel margin. The runtime measures the space below each card and above the next card or viewport edge. It centers the active sticker within that gap and pulls the camera back when the sticker needs more room.

Framing interpolates between story stops and fades out at the opening and final portrait. Desktop framing, the lens, and lighting remain unchanged. This uses actual card heights so later text edits and shorter phone screens can change the available space.

The browser verifier checks the entire projected decal against the card and viewport edges, its surface visibility, and its focus distance. Set `COMPARISON_VIEWPORTS=compact-phone` when running it to verify the 375 × 667 layout. The default run covers desktop and 390 × 844 phone layouts.

## Validation

On 2026-09-17, the production build, lint, and 30 artifact checks passed. Lint retains five existing warnings. The browser suite passed all 169 checks across 1440 × 900 desktop, 390 × 844 phone, and 375 × 667 compact phone viewports. It exercised all story stops, the project gallery, four detail panels, closing and scroll restoration, asset loading, and the new sticker visibility, focus, and card-clearance checks.

Card clearance is checked at the settled story stops. During scrolling, the cards pass over the character as in the reference interaction. The composer and camera postpass reproduce the committed scene byte for byte.
