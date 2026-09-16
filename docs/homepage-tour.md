# Run and change the homepage tour

Use this guide to edit the six-stop homepage at `/`. Read [the cinematic tour reference](cinematic-tour.md) for the visual direction, asset sources, and model constraints. The written hub remains at `/hub`.

## Open the tour

Run the development server.

```bash
npm run dev
```

Open `http://localhost:3000`. Scroll, choose a stop in the top navigation, or click an illustrated sticker. Open `/#cells` to start at the Cells stop. `/3d` redirects to `/` and retains the fragment.

To inspect the static presentation, enable reduced motion or disable JavaScript. Confirm that the poster and all six annotations remain readable, including the Job Search workstation still.

## Edit a stop

1. Open `content/tour.ts` and edit the matching entry in `tour.stops`.
2. Update the copy, links, and tint together with the scene composition.
3. Set `camera.position`, `camera.target`, and `camera.fov` for desktop.
4. Set `camera.phone` independently for portrait screens.
5. Set `camera.focalPoint` on the actual subject. Keep it separate from the composition target when the latter leaves space for text.
6. Adjust `camera.aperture` and `camera.maxblur` while inspecting the subject's legibility.
7. Check the stop and both adjacent transitions on desktop and phone.

Keep all six stops. Start, Clinical AI, Cells, Job Search OS, Loops, and Off hours. Preserve native document scroll, per-stop hashes, and the static fallbacks.

Edit `app/_tour/tour.css` for the tour's dark grounds, Fraunces headings, bare annotation rails, and responsive spacing. Leave the hub's `public/css/style.css` unchanged.

## Edit the Job Search workstation

Edit `tour.workstation` in `content/tour.ts` to change the desk's position, scale, tiles, or running loop. `app/_tour/workstation.ts` builds the rig. Check the separate desktop and phone camera compositions after moving it.

Keep the bust fade tied to the workstation's presence. The settled Job Search scene shows the workstation alone.

To change a tool tile or the screen, edit `scripts/3d/make-workstation.mjs` and run it. The tiles use generic drawings and wordmarks. Use only facts already public in [the Job Search repository](https://github.com/JunyiZhou-Conny/job-search-2026-2027-starter) for the annotation. Do not add jobs, offers, sponsorships, or submitted-application counts.

## Place an illustrated sticker

1. Open `http://localhost:3000/?place=1` and click the sweater. Placement mode disables idle rotation.
2. Copy the emitted surface position and normal from the console or placement panel into `tour.stickers`.
3. Set `id`, `kind`, `label`, `image`, `size`, `rotation`, and the destination `stopId`.
4. Add a transparent 512 × 512 WebP texture under `public/3d/stickers/`.
5. Inspect the full decal from every stop where it is visible. Move clipped placements inboard and re-raycast the new surface position.
6. Check pointer navigation and the equivalent keyboard link.

Keep eight or fewer stickers on the sweater. Use irregular illustrated silhouettes, varied sizes, and cream borders. The six active `*-illustrated.webp` files are generated artwork. `scripts/3d/make-stickers.mjs` regenerates only the older SVG icons and the placement marker.

## Swap the bust

1. Export a binary glTF with Y up and the face toward +z.
2. Compress the model to Meshopt.

```bash
npx @gltf-transform/cli optimize me.glb public/3d/me.glb --compress meshopt --simplify false --texture-compress webp --texture-size 1024
```

3. Set `model.src`, `model.posterAlt`, and `model.credit` in `content/tour.ts`. Use `model.yaw` for an orientation correction.
4. If the new model has no texture, add `model.material` to select a clay color. Keep `model.finish` matte.
5. Disable or recalibrate the model-specific ear repair in `Tour.tsx` and `character-material.ts` if you replace `conny-bust.glb` in place.
6. Re-author the desktop and phone cameras, focal points, and sticker placements against the fitted model.
7. Refresh the stills and run the checks below.

The loader fits the complete model to one unit tall, places its base at y=0, and centers x and z. It decodes Meshopt. Convert a Draco asset before using it here.

## Refresh the stills

The poster and workstation still must match the current textures, lighting, and composition. Regenerate both with the checked-in renderer script while the site runs.

```bash
TOUR_URL=http://localhost:3000 node scripts/3d/render-stills.mjs
```

Set `PLAYWRIGHT_MODULE` when Playwright is installed outside the project. For a manual capture, use these settings.

1. Open `/?place=1#start` at 1600 × 1000 and wait for `.tour[data-mode="live"]` and the loading overlay's fade.
2. Capture `.tour-stage canvas` directly, without the DOM annotations or viewfinder. Save `public/3d/poster.jpg` at JPEG quality 85.
3. Open `/?place=1#jobs` at 1100 × 700 and wait for the camera and workstation fade to settle.
4. Capture the canvas as `public/3d/job-search-still.webp` and keep the corresponding `still` dimensions and alt text accurate.
5. Inspect both images in reduced-motion, no-JavaScript, and WebGL-failure presentations.

## Check the changes

Run the repository checks.

```bash
npm run verify
```

With a server running and Playwright available, run the browser checks against its URL.

```bash
TOUR_URL=http://localhost:3000 node scripts/verify/tour.mjs
```

Set `PLAYWRIGHT_MODULE` to the installed Playwright module if it is outside the project. Inspect all six desktop and phone screenshots as well as the static presentations. A passing build does not establish that camera framing or decal placement is correct.
