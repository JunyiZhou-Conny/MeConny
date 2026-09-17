# Publish and iterate on Conny's website

## Deployment boundary

The Vercel project is `junyizhou-conny/me-conny`, connected to `JunyiZhou-Conny/MeConny`. Its existing root stays at the repository root. The committed `vercel.json` selects the Vite framework, `npm ci --prefix web`, `npm run build --prefix web`, and output `web/dist`. Root `package.json` selects Node.js 24 for the project.

The standalone package preserves the reference frontend's React 18, R3F 8, Three 0.169, and dependency lockfile. The root Next.js package is archived and is not installed by the deployment command. The added frontend build step copies the existing hub files and required license notices after Vite completes.

`web/postcss.config.mjs` declares an empty plugin list. This keeps Vite's configuration lookup inside its own package, matching the original plain-CSS build instead of inheriting the archived Next application's Tailwind plugin.

| URL | Deployed content |
| --- | --- |
| `/` | Current 3D homepage from `web/dist/index.html` |
| `/hub` | Unchanged written hub from `public/index.html`, built as `web/dist/hub.html` |
| `/hub/` | Permanent redirect to `/hub`, preserving the hub's relative asset paths |
| `/3d` | Temporary redirect to `/` |
| `/css/*`, `/js/*`, `/favicon/*` | Existing hub assets, copied unchanged |

The domain's existing `connyzhou.com` to `www.connyzhou.com` redirect is managed by Vercel. No DNS changes are required for this source migration.

## Source and licensing

The imported frontend is from `JunyiZhou-Conny/my-3d-resume` commit `66356f85c2930a41d0c19375b34326a55bffd7a9`, merged into that repository as `0225fc889a6614131f49f751a9d49e35169d7321`. The upstream scene baseline is `dayinji/sen-3d-resume` commit `c9a9fe373cde72c77ff7f2dabde17fb79dce89b3`.

The original [LICENSE](reference/LICENSE) and [NOTICE](reference/NOTICE) are retained verbatim. They distinguish the scene code from the author's personal content and third-party assets. The author's personal geometry, textures, logos, biography, social profiles, and project descriptions were replaced in the imported frontend. Conny's character and sticker illustrations come from the user's supplied assets and earlier MeConny work.

The camera and focus data, HDR environment, and fonts are inherited from the reference. The bundled Cormorant Upright and Mansalva fonts retain their official SIL Open Font License texts from Google Fonts, with immutable source links recorded in [the font provenance file](reference/fonts/README.md). The build ships those notices under `/licenses/fonts/` and the scene LICENSE and NOTICE under `/licenses/scene/`. The verifier checks every shipped notice byte for byte locally and on the hosted preview.

The NOTICE leaves the HDR source license to be confirmed. This import does not claim a new license for that asset. The upstream Blender source is not imported as Conny's source.

The accepted model SHA-256 is `c4f68c6670534f528d2c663cf4cc0100c8f84c4803b2f28d435e92f8e237a7f7`. Its static bind pose preserves the supplied wink, smile, purple shirt, and peace sign. Eye tracking is inactive because this character has painted eyes and no independent eye meshes. Six embedded decals stay on the shirt in this release. The separate open-eye and face-sticker experiment does not alter this accepted release.

The reference settings produce bright highlights, close facial framing, and a partial raised-hand crop on phone. These observed properties are preserved for this publication.

The only visitor-facing addition is a `More about me` link in the existing Open methods section. It makes the retained written hub discoverable without changing the scene, navigation layout, or visual styling.

## Verify before release

Run from the repository root with Node.js 24:

```bash
npm ci --prefix web
npm run verify
npm run preview --prefix web -- --host 127.0.0.1 --port 3021 --strictPort
```

`npm run verify` runs the frontend lint and production build, then verifies source hashes, dependencies, deployment settings, the accepted GLB, every copied hub asset, and the shipped license notices. `web/package-lock.json` remains byte-identical to the fork. The frontend manifest differs only by its static-asset-copy `postbuild` command.

Run the existing browser suite against the production preview or deployed URL, using an installed Playwright module:

```bash
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
COMPARISON_URL=http://localhost:3021 \
node web/scripts/verify-reference.mjs /absolute/path/to/evidence
```

It checks desktop and phone layouts, the original camera settings, five scroll stops, works rotation, all four project panels, real repository links, loaded images, native scroll restoration, and runtime errors. Baseline hashes and camera values are stored in `docs/reference/scene-contract.json`, so upstream Git history is not required in this repository.

After the branch receives a Vercel preview, also run:

```bash
node web/scripts/verify-publication.mjs https://your-preview.vercel.app
```

This verifies the actual served model, sticker, hub, hub assets, and license notices against the local build, then checks `/hub/` and `/3d` redirects. Vite's local preview does not implement Vercel routing; use `/hub.html` there. Inspect the hub and current homepage in the browser before release.

The custom domain's existing [Cloudflare email obfuscation](https://developers.cloudflare.com/waf/tools/scrape-shield/email-address-obfuscation/) rewrites the hub's email links and visible address, then injects an email decoder. For a differing hub response identified as Cloudflare, the verifier restores only those recognized email encodings and removes exactly one recognized decoder script before comparing the entire HTML with the build. Other HTML changes still fail. All other asset and license comparisons remain byte-exact, and HTTP status and redirect checks remain unchanged.

## Release and rollback

The first reference-scene release shipped on September 17, 2026 through [PR 12](https://github.com/JunyiZhou-Conny/MeConny/pull/12), production commit `4793b09e2a994e83822a7ca8cdfd251e9f7f8d9a`. GitHub recorded successful production deployment `6506850832`, available at [me-conny-my4nai87s](https://me-conny-my4nai87s-junyizhou-conny.vercel.app) and its [Vercel deployment page](https://vercel.com/junyizhou-conny/me-conny/BgLcWQeW7gS1decMMqxnjeRWvXEy).

The public site passed all 88 desktop and phone browser checks, including the camera sequence and four project panels. All 72 remote publication checks passed after accounting for Cloudflare's email obfuscation. The apex domain returns HTTP 308 to `https://www.connyzhou.com/`; the homepage, written hub, assets, license notices, and route redirects were verified on the public domain.

Use a feature branch for each iteration. Review its hosted preview, then merge the verified source into `main` to trigger production through the existing GitHub integration. Re-run both verification commands against the custom domain and check the apex redirect. MeConny is the editable production source of truth; no build-time fetch from another repository is used.

The previously recorded production was commit `cc745ab6b21bd473ea0efc71321fc59f423f53f7`. Its GitHub deployment ID is `6093360767`, and the recorded deployment URL is [me-conny-g404b4ql7](https://me-conny-g404b4ql7-junyizhou-conny.vercel.app). Its [Vercel deployment page](https://vercel.com/junyizhou-conny/me-conny/FacHrRQyCXEyG4wKBSVJ58QHDd3n) identifies the existing project. Confirm the currently active production deployment when releasing, since dashboard actions may be newer than GitHub's history.

Vercel [Instant Rollback](https://vercel.com/docs/instant-rollback) can restore a previous production deployment. Hobby permits the immediately previous production deployment. After rollback, automatic domain assignment is disabled until another deployment is promoted. Record the released commit and actual deployment URL with each release.

## Rebuild the character asset

`web/scripts/build-reference-scene.mjs` takes explicit paths to the upstream scene GLB, Conny's prepared source GLB, the sticker directory, and an output GLB. The optional final argument selects placement JSON; its default is `web/scripts/conny-scene.json`. The source character was stored at `public/3d/conny-character.glb` in MeConny commit `3398a3be4d3f0b7f05d7751aadc0200f5fffa51f`.

```bash
node web/scripts/build-reference-scene.mjs \
  /path/to/upstream-me.glb \
  /path/to/conny-character.glb \
  web/public/stickers \
  /path/to/new-me.glb
```

Review the output before replacing `web/public/models/me.glb`. The composer retains camera samples and focus anchors, verifies the static bind pose, copies Conny's geometry and atlas, and projects the decal placement data. Keep preparation inputs separate from the generated output.
