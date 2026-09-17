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

The **look** is Javis Ng’s published GitHub Pages chrome (`public/css/style.css`, `public/js/*`), from [javis603.github.io](https://github.com/Javis603/javis603.github.io). The **words** are Conny’s. Do not put Javis’s name, Token Monitor, Discord-AIBot, or `javis-ai.com` back on this hub. Do not poll his Token Monitor worker.

The deployed site serves `public/index.html` at `/hub` through the static build described above. The archived `proxy.ts` served it at `/`. Do not rebuild the hub as a React page unless asked.

## Commands

```bash
npm run dev       # Vite homepage
npm run build     # production build
npm run lint      # ESLint
npm run verify    # lint + build
```

## Content contract

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

## GitHub front door

[`profile/README.md`](profile/README.md) is a draft for a future `JunyiZhou-Conny/JunyiZhou-Conny` profile repo. [`docs/github-hygiene.md`](docs/github-hygiene.md) lists description/topic patches for the three featured repos. This checkout cannot edit those other repositories.

## Commit messages

`type(scope): subject` — `feat`, `fix`, `docs`, `chore`. Subject describes the change. No AI `Co-Authored-By` trailer.
