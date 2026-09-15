# How to run and change the homepage tour

`/` is a scroll tour around a clay bust of Conny, with stickers on the sweater and a workstation scene for the Job Search stop. It is the front door. The written hub moved to `/hub` and keeps its own chrome.

## Open the tour

```bash
npm run dev
```

Open `http://localhost:3000`. Scroll, or click a tag in the top bar, and the camera flies to that stop. The URL hash follows the active stop, so `http://localhost:3000/#cells` opens on the speciesOT stop. `/3d` still works: it redirects to `/`, and the browser carries the fragment, so `/3d#cells` lands on the same stop.

With `prefers-reduced-motion: reduce`, with JavaScript off, or when WebGL fails, the page shows `public/3d/poster.jpg` and all six cards stacked. Nothing moves.

## Where things live

- `content/tour.ts` is the one table the page reads. Stops carry the card copy, the laptop camera, the phone camera, and the background tint. Stickers carry a surface point, an outward normal, a size, and a rotation. `workstation` carries the Job Search rig.
- `app/_tour/Tour.tsx` turns that table into the scene. Scroll position maps to one number `t` in stop units. Camera, tint, active card, and the workstation's reveal all derive from `t`.
- `app/_tour/workstation.ts` builds the Job Search rig. `app/_tour/clay.ts` holds the two shapes everything is made of: a soft ground blob and a rounded, bevelled slab.
- `app/_tour/tour.css` is the light warm page chrome. It overrides the dark root layout with `html:has(.tour)` and `body:has(.tour)` selectors and never touches `public/css/style.css`.
- `proxy.ts` serves `public/index.html` at `/hub`. `next.config.ts` redirects `/3d` to `/`.
- `public/3d/conny-bust.glb` is the bust, 15,000 triangles with one baked 1024 texture. `public/3d/stickers/*.svg` are the stickers, `public/3d/workstation/*.svg` the workstation textures, `public/3d/poster.jpg` the still.
- `scripts/3d/make-stickers.mjs` and `scripts/3d/make-workstation.mjs` write the SVGs.

## The six stops

Start, Clinical AI, Cells, Job Search OS, Loops, Off hours. Never drop Job Search. If the page runs long, merge Clinical into Cells.

## The Job Search workstation

Stop four is a scene, not a card: a mini desk, a laptop with a lit editor screen, four floating tool tiles, and three dots running a closed loop between them. It fades in as the scroll approaches its stop and is gone by the time the next stop arrives, so the other five stay clean.

The rig has its own local frame — desk on `y = 0`, centered on `x`, facing `+z` — and `workstation.position`, `rotation`, and `scale` place it in model space next to the bust. Tiles face the camera on the Y axis, because the laptop camera looks at the desk from the front right and the phone camera from straight on.

Two rules for this stop:

- Tile art is a generic drawing plus a wordmark, not a vendor logo. Edit `scripts/3d/make-workstation.mjs` and rerun it.
- Card copy may only use facts already public in [`job-search-2026-2027-starter`](https://github.com/JunyiZhou-Conny/job-search-2026-2027-starter). No jobs, offers, sponsorships, or submitted-application counts.

## The bust

`public/3d/conny-bust.glb` is a clay model of Conny, shaped from one portrait with Hunyuan3D-2 and finished in Blender. Free tools only. It is 15,000 triangles with one baked 1024 base color, Meshopt geometry and a WebP texture, 231 KB in total.

Two things about it are worth knowing before you touch it:

- **The loader decodes Meshopt, not Draco.** `Tour.tsx` installs `MeshoptDecoder` and nothing else. A Draco GLB will fail to load and the page will fall back to the poster. Re-encode instead of adding a second decoder.
- **The loader fits whatever arrives.** It measures the bounding box, scales the mesh to one unit tall, drops its base on the floor, and centers the footprint on x and z. The source file is 2 units tall and centered on the origin; nothing in the repo depends on that. `model.yaw` is the correction if a mesh was authored facing somewhere other than +z.

Known limits, carried over from the build notes: the ear reads soft in profile, the back of the head is flat color, and the eyes are painted rather than modeled. The cameras stay in three-quarter and front angles, where all three are clean.

## Swap the bust for your own figure

1. Export as glTF binary, Y up, face toward +z. Any scale and any origin work, because the loader fits it.
2. Compress it to Meshopt and put it in place:

```bash
npx @gltf-transform/cli optimize me.glb public/3d/me.glb --compress meshopt --simplify false --texture-compress webp --texture-size 1024
```

Drop `--texture-compress webp` if the mesh has no texture worth keeping.

3. In `content/tour.ts`, set `model.src` to `/3d/me.glb` and update `model.posterAlt` and `model.credit`. If the GLB has no texture, add a `model.material` block and the loader will paint the whole mesh one flat clay color instead. `model.finish` is forced onto whichever material wins, so clay stays matte.
4. Run `npm run dev`, open `/`, and move each stop's `camera.position`, `camera.target`, and `camera.fov` until the framing reads. Laptop cameras leave the right third of the frame for the card. Phone cameras carry their own `fov`, because a portrait crop is narrow and a wide subject needs a wider angle there. Check `workstation.position` too: the Job Search framing assumes the desk sits just off the bust's front left.
5. Place stickers again. Old positions are surface points on the old mesh and will float or sink on a new one. Keep the count at eight or fewer and keep them off the face.
6. Render a new poster (see below).
7. Run `npm run verify`.

## Place a sticker

Open `http://localhost:3000/?place=1` and click the figure. The page prints a ready-to-paste sticker entry to the console and to a box in the top left corner. Paste it into `tour.stickers` in `content/tour.ts`, then set `id`, `kind`, `label`, `image`, `size`, and `rotation`. Idle rotation is off in place mode so the printed coordinates are exact model space.

To add a sticker image, add an entry to `stickers` in `scripts/3d/make-stickers.mjs` and run `node scripts/3d/make-stickers.mjs`. Stickers are 512 by 512 SVGs with a cream die-cut border. Any square PNG works too.

They go on the sweater, never on the face. The face is the identity; a sticker on a cheek reads as a rash rather than a badge.

## Render the poster

The poster is a still of the first stop under the current lighting and the current sticker set. It goes stale the moment either changes.

Open `/?place=1` at 1600 by 1000 so the idle sway holds at zero, wait for `data-mode="live"`, hide `.tour-bar`, `.tour-cards`, `.tour-credit`, `.tour-place`, and `.tour-poster`, then save the frame as `public/3d/poster.jpg` at quality 82.
