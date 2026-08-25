<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# MeConny

This is the public hub for Junyi (Conny) Zhou. It is a person page, not a product dump and not a CV.

The **look** is Javis Ng’s published GitHub Pages chrome (`public/css/style.css`, `public/js/*`), from [javis603.github.io](https://github.com/Javis603/javis603.github.io). The **words** are Conny’s. Do not put Javis’s name, Token Monitor, Discord-AIBot, or `javis-ai.com` back on this hub. Do not poll his Token Monitor worker.

`proxy.ts` serves `public/index.html` at `/`. Do not rebuild the hub as a React page unless asked.

## Commands

```bash
npm run dev       # local hub
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
