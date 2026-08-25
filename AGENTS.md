<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# MeConny

This is the public hub for Junyi (Conny) Zhou. It is a person page, not a product dump and not a CV.

Javis Ng’s site and Token Monitor are **references for information architecture only**. Do not copy their HTML, CSS, JS, copy, or product pages. Do not feature Token Monitor as Conny’s work.

## Commands

```bash
npm run dev       # local hub
npm run build     # production build
npm run lint      # ESLint
npm run verify    # lint + build
```

## Content contract

All public copy lives in [`content/site.ts`](content/site.ts). Layout in `app/` only renders that packet.

To change who Conny is, what is featured, or how a card reads: edit the packet. Do not hardcode new biography in a component.

To add a featured project:

1. Confirm it earned a hub card (one sentence why a stranger should see it).
2. Append an object to `site.work.featured`. Keep the list at **three**. Move the displaced card to `supporting` or off the page.
3. Use only facts that are already public. Do not invent unpublished science results.
4. Run `npm run verify`.

## Curation rules

- Three featured systems. Four pillars. No 12-card grid.
- Coursework, forks, empty repos, and personal-application repos stay off the hub.
- Proof over adjectives. Static counts from public READMEs are allowed. Fake LIVE counters are not.
- Product landing pages come after a product exists. Do not invent `/work/...` marketing routes in v1 unless asked.

## Visual system

Dark editorial. Cool teal (`--tide` on `--canvas`). Fraunces + IBM Plex. Mark is `周` / `CZ`. This is not cream-on-black Outfit, and it is not a particle monogram.

Respect `prefers-reduced-motion`. Keep the skip link.

## GitHub front door

[`profile/README.md`](profile/README.md) is a draft for a future `JunyiZhou-Conny/JunyiZhou-Conny` profile repo. [`docs/github-hygiene.md`](docs/github-hygiene.md) lists description/topic patches for the three featured repos. This checkout cannot edit those other repositories.

## Commit messages

`type(scope): subject` — `feat`, `fix`, `docs`, `chore`. Subject describes the change. No AI `Co-Authored-By` trailer.
