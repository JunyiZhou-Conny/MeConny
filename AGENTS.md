<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# MeConny

This is the public page for Junyi (Conny) Zhou. It is a person page, not a product dump and not a CV.

## Routes

| Path | What it is | Who serves it |
| --- | --- | --- |
| `/` | the 3D scroll tour — the homepage | `app/page.tsx` → `app/_tour/Tour.tsx` |
| `/3d` | alias, 307 to `/` | `redirects()` in `next.config.ts` |
| `/hub` | the written hub | `proxy.ts` reads `public/index.html` |

The tour is the front door. The hub is the long-form page behind it. Do not rebuild the hub as a React page unless asked, and do not restyle it.

The hub's **look** is Javis Ng’s published GitHub Pages chrome (`public/css/style.css`, `public/js/*`), from [javis603.github.io](https://github.com/Javis603/javis603.github.io). The **words** are Conny’s. Do not put Javis’s name, Token Monitor, Discord-AIBot, or `javis-ai.com` back on this page. Do not poll his Token Monitor worker.

## Commands

```bash
npm run dev       # local site
npm run build     # production build
npm run lint      # ESLint
npm run verify    # lint + build
```

## The tour at `/`

[`content/tour.ts`](content/tour.ts) is the one typed table the page reads: stops, cameras, tints, stickers, and the Job Search workstation. [`docs/homepage-tour.md`](docs/homepage-tour.md) is the runbook for opening it, swapping the bust, placing a sticker, and re-rendering the poster.

Rules that outlive any one change:

- **Six stops.** Start, Clinical AI, Cells, Job Search OS, Loops, Off hours. Keep all six.
- **Job Search is a scene.** The mini desk, the screen, the tool tiles, and the loop share the frame with Conny. Its annotation copy may only use facts already public in [`job-search-2026-2027-starter`](https://github.com/JunyiZhou-Conny/job-search-2026-2027-starter). No jobs, offers, sponsorships, or submitted-application counts.
- **Keep native document scroll.** One annotation at a time, stop tags, hash per stop, tint per stop. Do not hijack the wheel.
- **Keep the fallbacks.** `prefers-reduced-motion`, no JavaScript, and a failed WebGL context all fall back to the poster plus stacked cards.
- **Stickers are story cues.** Keep eight or fewer illustrated stickers on the sweater and none on the face. Use transparent 512px WebP art with cream borders. Set an explicit `stopId` for each interactive sticker.
- **The bust is Conny.** `public/3d/conny-bust.glb`, built from one portrait in Blender. `model.src` in `content/tour.ts` is the single swap point, and the loader fits whatever arrives to one unit tall with its base on the floor. The loader decodes Meshopt, not Draco.

## The hub at `/hub`

Visible copy lives in [`public/index.html`](public/index.html). Keep the existing class names so Javis’s CSS still applies.

[`content/site.ts`](content/site.ts) is the inventory of facts the hub is allowed to claim. If you change a project, update both files.

To add a featured project:

1. Confirm it earned a hub card (one sentence why a stranger should see it).
2. Keep **three** `article.project-case` blocks. Reuse the Token Monitor widget, window, or infra-map visuals already in the CSS.
3. Use only facts that are already public. Do not invent unpublished science results.
4. Run `npm run verify`.

## Curation rules

- Three featured systems. Four pillars. No 12-card grid.
- Coursework, forks, empty repos, and personal-application repos stay off the hub.
- Proof over adjectives. Static counts from public READMEs are allowed. Do not fake a LIVE token counter.
- Product landing pages come after a product exists.

## Visual system

Do not restyle `public/css/style.css` unless the user asks. Outfit, cream-on-near-black, particle monogram, floating nav, skill universe — that is the point. The monogram letters are `CZ` in `public/js/hero-particles.js`.

The tour uses warm dark grounds, light text, Fraunces headings, and IBM Plex body copy and counters. Bare annotations sit beside thin rails over the scene. Illustrated sweater stickers lead into project close-ups, Job Search places the workstation beside Conny, and Off hours returns to a frontal contact portrait. It lives in [`app/_tour/tour.css`](app/_tour/tour.css) and never touches `public/css/style.css`.

Keep `camera.focalPoint` on the subject and `camera.target` responsible for composition. The HDR environment and depth of field belong to the scene. [`docs/cinematic-tour.md`](docs/cinematic-tour.md) records asset provenance and the current model limits. The localized ear shader is calibrated to the existing GLB; disable or recalibrate it when replacing that asset.

## GitHub front door

[`profile/README.md`](profile/README.md) is a draft for a future `JunyiZhou-Conny/JunyiZhou-Conny` profile repo. [`docs/github-hygiene.md`](docs/github-hygiene.md) lists description/topic patches for the three featured repos. This checkout cannot edit those other repositories.

## Commit messages

`type(scope): subject` — `feat`, `fix`, `docs`, `chore`. Subject describes the change. No AI `Co-Authored-By` trailer.

## pstack

Initiate "poteto-mode" to work on my repository to achieve the handoff goal. The other pdf is super important in the sense that it contains every this idea of personal website originally comes from and some of the tech specs that are there.
