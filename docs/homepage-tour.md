# How to run and change the homepage tour

`/` is a scroll tour around a bust with stickers for work and hobbies and a workstation scene for the Job Search stop. It is the front door. The written hub moved to `/hub` and keeps its own chrome.

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
- `public/3d/einstein.glb` is the stand-in bust. `public/3d/stickers/*.svg` are the stickers, `public/3d/workstation/*.svg` the workstation textures, `public/3d/poster.jpg` the still.
- `scripts/3d/stl_to_glb.py` builds a GLB from a scan STL. `scripts/3d/make-stickers.mjs` and `scripts/3d/make-workstation.mjs` write the SVGs.

## The six stops

Start, Clinical AI, Cells, Job Search OS, Loops, Off hours. Never drop Job Search. If the page runs long, merge Clinical into Cells.

## The Job Search workstation

Stop four is a scene, not a card: a mini desk, a laptop with a lit editor screen, four floating tool tiles, and three dots running a closed loop between them. It fades in as the scroll approaches its stop and is gone by the time the next stop arrives, so the other five stay clean.

The rig has its own local frame — desk on `y = 0`, centered on `x`, facing `+z` — and `workstation.position`, `rotation`, and `scale` place it in model space next to the bust. Tiles face the camera on the Y axis, because the laptop camera looks at the desk from the front right and the phone camera from straight on.

Two rules for this stop:

- Tile art is a generic drawing plus a wordmark, not a vendor logo. Edit `scripts/3d/make-workstation.mjs` and rerun it.
- Card copy may only use facts already public in [`job-search-2026-2027-starter`](https://github.com/JunyiZhou-Conny/job-search-2026-2027-starter). No jobs, offers, sponsorships, or submitted-application counts.

## Swap the bust for your own figure

1. Export your figure as glTF binary. Keep it under 2 MB after compression. Y up, face toward +z, feet or base at y = 0. Any scale works, but the stop cameras below assume a height of about 1 unit.
2. Compress it and put it in place:

```bash
npx @gltf-transform/cli optimize me.glb public/3d/me.glb --compress meshopt --simplify false --texture-compress false
```

3. In `content/tour.ts`, set `model.src` to `/3d/me.glb`, update `model.posterAlt`, `model.credit`, and `model.material.color`. If the GLB carries its own textures and you want them, delete the material replacement in `Tour.tsx` where every mesh gets a `MeshStandardMaterial`.
4. Run `npm run dev`, open `/`, and move each stop's `camera.position` and `camera.target` until the framing reads. Laptop cameras leave the right third of the frame for the card. Phone cameras stand farther back, because the card sits at the bottom there. Check `workstation.position` too: the Job Search framing assumes the desk sits just off the bust's front left.
5. Place stickers again. Old positions are surface points on Einstein and will float or sink on a new mesh. Keep the count at eight or fewer, and no more than three on the face.
6. Render a new poster (see below).
7. Run `npm run verify`.

## Place a sticker

Open `http://localhost:3000/?place=1` and click the figure. The page prints a ready-to-paste sticker entry to the console and to a box in the top left corner. Paste it into `tour.stickers` in `content/tour.ts`, then set `id`, `kind`, `label`, `image`, `size`, and `rotation`. Idle rotation is off in place mode so the printed coordinates are exact model space.

To add a sticker image, add an entry to `stickers` in `scripts/3d/make-stickers.mjs` and run `node scripts/3d/make-stickers.mjs`. Stickers are 512 by 512 SVGs with a cream die-cut border. Any square PNG works too.

## Render the poster

The poster is a still of the first stop under the current lighting and the current sticker set. It goes stale the moment either changes.

Open `/?place=1` at 1600 by 1000 so the idle sway holds at zero, wait for `data-mode="live"`, hide `.tour-bar`, `.tour-cards`, `.tour-credit`, `.tour-place`, and `.tour-poster`, then save the frame as `public/3d/poster.jpg` at quality 82.

## Rebuild the Einstein bust from the scan

The source is the 1930 Artur Loewenthal bronze, scanned by Oliver Laric for Lincoln 3D Scans and published without copyright restrictions.

```bash
curl -L -o /tmp/einstein.stl https://s3-eu-west-1.amazonaws.com/lincoln-3d-project/einstein.stl
python3 -m pip install --user trimesh fast-simplification numpy scipy
python3 scripts/3d/stl_to_glb.py /tmp/einstein.stl /tmp/einstein-raw.glb --faces 40000 --height 1.0 --rotate-x 180
npx @gltf-transform/cli optimize /tmp/einstein-raw.glb public/3d/einstein.glb --compress meshopt --simplify false --texture-compress false
```

The scan is upside down, so `--rotate-x 180` puts the head up and the face toward +z. The result is 40,000 triangles and 172 KB.
