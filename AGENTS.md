# Production application

The deployed website is the standalone Vite application in `web/`. All scene work and frontend dependencies belong to that package. Root `app/`, `proxy.ts`, and Next.js files are archived sources. The Next.js rules below apply only when explicitly working on that archived implementation.

Use Node.js 24. From the repository root:

```bash
npm ci --prefix web
npm run dev
npm run verify
npm run preview --prefix web -- --port 3021
```

`vercel.json` at the repository root selects the `web/` build through explicit install, build, and output settings. Preserve the existing project and domain associations. Ordinary feature branches receive previews; `main` is the production branch.

The homepage uses the scene from `JunyiZhou-Conny/my-3d-resume`. Its imported commit and original scene configuration are recorded in `docs/reference/scene-contract.json`. Keep that contract when publishing the accepted design. Deliberate future design changes should update the contract and their visual evidence together.

`web/src/App.tsx` owns the introduction, `web/src/ui/Resume.tsx` owns the five focus entries, and `web/src/data/works.ts` plus `web/src/content/works/` own project details. Runtime configuration lives in `web/src/scene/Scene.tsx` and `Env.tsx`. The character is `web/public/models/me.glb`. Do not mix the root Next/React dependencies with the frontend's React 18 and R3F 8 dependency tree.

The existing written hub remains sourced from `public/index.html`, `public/css/`, `public/js/`, and `public/favicon/`. `web/scripts/copy-hub.mjs` copies it after each production build. Vercel serves it at `/hub`; `/hub/` canonicalizes to `/hub`, and `/3d` redirects to `/`. Do not create a second editable copy of the hub in `web/public`.

The remaining content and curation rules below apply to that written hub. See `docs/publication.md` for verification, provenance, and rollback.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# MeConny

This is the public hub for Junyi (Conny) Zhou. It is a person page, not a product dump and not a CV.

The look started as Javis Ng’s published GitHub Pages chrome (`public/css/style.css`, `public/js/*`), from [javis603.github.io](https://github.com/Javis603/javis603.github.io). On 2026-09-15 the template chrome was cut and the page is moving to its own look. See Visual system below. The **words** are Conny’s. Do not put Javis’s name, Token Monitor, Discord-AIBot, or `javis-ai.com` back on this hub. Do not poll his Token Monitor worker.

The deployed site serves `public/index.html` at `/hub` through the static build described above. The archived `proxy.ts` served it at `/`. Do not rebuild the hub as a React page unless asked.

## Commands

```bash
npm run dev       # Vite homepage
npm run build     # production build
npm run lint      # ESLint
npm run verify    # lint + build
```

## Content contract

Visible copy lives in [`public/index.html`](public/index.html). Keep the existing class names so the CSS still applies.

[`content/site.ts`](content/site.ts) is the inventory of facts the hub is allowed to claim. If you change a project, update both files.

To add a featured project:

1. Confirm it earned a hub card (one sentence why a stranger should see it).
2. Keep **three** `article.project-case` blocks. Reuse the `.tm-widget` card skin, the window, or the infra-map visuals already in the CSS.
3. Use only facts that are already public. Do not invent unpublished science results.
4. Run `npm run verify`.

## Curation rules

- Three featured systems. Four pillars. No 12-card grid.
- Coursework, forks, empty repos, and personal-application repos stay off the hub.
- Proof over adjectives. Static counts from public READMEs are allowed. Do not fake a LIVE token counter.
- Product landing pages come after a product exists.

## Visual system

The restyle was asked for on 2026-09-15. The direction is a light warm keynote. Product as hero, one idea per screen, color from three system worlds. Values to build with, tuned in the build. Page `#F2ECE2`. Raised card `#FAF6EF`. Ink `#1A1613`. Muted ink `#6A6058`. Hairline `rgba(26,22,19,.14)`. Signal `#E8492A`, for focus and active states only. Dark stays inside product windows. Worlds. Daylight `#FFB47A` to `#FF6B5B` for Pediatric Savior. Cells `#1FB7A6` to `#7A5CF5` for speciesOT. Night `#14275A` to `#F2A93B` for Autoresearch. Hero and contact stay on paper. Type is Geist Sans from Google Fonts, 400 to 700. No mono for labels. No all-caps eyebrows.

The current CSS is an interim dark Outfit base with the template chrome removed. Build the hero and the three sections on it. The four-category tools block is interim too. The direction folds skills into one quiet line under each system.

Do not restore any of the following. They read as a developer template to the audience this page is for.

- The orbiting skill universe, its planets, orbits, core, stat pills, and detail panel.
- The logo loop or any icon marquee.
- The particle monogram and `hero-particles.js`.
- Numbered section labels such as 01 to 04.
- Middle-dot joined strings. Use commas or "and".
- Gradient text on single words or on the hero name. No shimmer.
- Arrow or chevron suffixes on links and buttons.
- The Busuanzi view counter.
- The donor's gold period. The mark is `CZ` with a cream period. `public/favicon/*` is generated from that mark.

Motion budget. One orchestrated moment on load or first scroll, then quiet. Animate `transform` and `opacity` only. `prefers-reduced-motion` shows end states.

Skills for this work live in `.agents/skills/`. Read `frontend-design` and `web-design-guidelines` before writing UI. Read `apple-design` for keynote structure and `review-animations` before adding motion. `skills-lock.json` pins the sources.

## GitHub front door

[`profile/README.md`](profile/README.md) is a draft for a future `JunyiZhou-Conny/JunyiZhou-Conny` profile repo. [`docs/github-hygiene.md`](docs/github-hygiene.md) lists description/topic patches for the three featured repos. This checkout cannot edit those other repositories.

## Commit messages

`type(scope): subject` — `feat`, `fix`, `docs`, `chore`. Subject describes the change. No AI `Co-Authored-By` trailer.
