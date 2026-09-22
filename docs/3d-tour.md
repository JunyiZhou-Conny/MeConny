# How to run and change the /3d tour

`/3d` is a scroll tour around a bust with stickers for work and hobbies. It is a second page, not the hub. The hub at `/` stays the front door.

## Open the tour

```bash
npm run dev
```

Open `http://localhost:3000/3d`. Scroll, or click a tag in the top bar, and the camera flies to that stop. The URL hash follows the active stop, so `http://localhost:3000/3d#cells` opens on the speciesOT stop.

With `prefers-reduced-motion: reduce`, with JavaScript off, or when WebGL fails, the page shows `public/3d/poster.jpg` and all five cards stacked. Nothing moves.

## Where things live

- `content/tour.ts` is the one table the page reads. Stops carry the card copy, the laptop camera, the phone camera, and the background tint. Stickers carry a surface point, an outward normal, a size, and a rotation.
- `app/3d/Tour.tsx` turns that table into the scene. Scroll position maps to one number `t` in stop units. Camera, tint, and the active card derive from `t`.
- `app/3d/tour.css` is the light warm page chrome. It overrides the dark root layout with `html:has(.tour)` and `body:has(.tour)` selectors and never touches `public/css/style.css`.
- `public/3d/einstein.glb` is the stand-in bust. `public/3d/stickers/*.svg` are the placeholder stickers. `public/3d/poster.jpg` is the still.
- `scripts/3d/stl_to_glb.py` builds a GLB from a scan STL. `scripts/3d/make-stickers.mjs` writes the sticker SVGs.

## Swap the bust for your own figure

1. Export your figure as glTF binary. Keep it under 2 MB after compression. Y up, face toward +z, feet or base at y = 0. Any scale works, but the stop cameras below assume a height of about 1 unit.
2. Compress it and put it in place:

```bash
npx @gltf-transform/cli optimize me.glb public/3d/me.glb --compress meshopt --simplify false --texture-compress false
```

3. In `content/tour.ts`, set `model.src` to `/3d/me.glb`, update `model.posterAlt`, `model.credit`, and `model.material.color`. If the GLB carries its own textures and you want them, delete the material replacement in `Tour.tsx` where every mesh gets a `MeshStandardMaterial`.
4. Run `npm run dev`, open `/3d`, and move each stop's `camera.position` and `camera.target` until the framing reads. Laptop cameras leave the right third of the frame for the card. Phone cameras center the figure and stand farther back.
5. Place stickers again. Old positions are surface points on Einstein and will float or sink on a new mesh.
6. Render a new poster. Open `/3d` at 1600 by 1000, hide the bar, cards, and credit, and save the canvas as `public/3d/poster.jpg`.
7. Run `npm run verify`.

## Place a sticker

Open `http://localhost:3000/3d?place=1` and click the figure. The page prints a ready-to-paste sticker entry to the console and to a box in the top left corner. Paste it into `tour.stickers` in `content/tour.ts`, then set `id`, `kind`, `label`, `image`, `size`, and `rotation`. Idle rotation is off in place mode so the printed coordinates are exact model space.

To add a sticker image, add an entry to `stickers` in `scripts/3d/make-stickers.mjs` and run `node scripts/3d/make-stickers.mjs`. Stickers are 512 by 512 SVGs with a cream die-cut border. Any square PNG works too.

## Rebuild the Einstein bust from the scan

The source is the 1930 Artur Loewenthal bronze, scanned by Oliver Laric for Lincoln 3D Scans and published without copyright restrictions.

```bash
curl -L -o /tmp/einstein.stl https://s3-eu-west-1.amazonaws.com/lincoln-3d-project/einstein.stl
python3 -m pip install --user trimesh fast-simplification numpy scipy
python3 scripts/3d/stl_to_glb.py /tmp/einstein.stl /tmp/einstein-raw.glb --faces 40000 --height 1.0 --rotate-x 180
npx @gltf-transform/cli optimize /tmp/einstein-raw.glb public/3d/einstein.glb --compress meshopt --simplify false --texture-compress false
```

The scan is upside down, so `--rotate-x 180` puts the head up and the face toward +z. The result is 40,000 triangles and 172 KB.
