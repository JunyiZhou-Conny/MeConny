# Handoff continuation, 16 September 2026

This branch continues `codex/conny-character-polish` at `ca88b7d`, the work in PR #7. That branch already improves introductory copy, mobile navigation, metadata, and multi-mesh character loading. Those changes are preserved.

## Changes in this continuation

- Install all 47 upstream pstack skills under `.agents/skills/`. The 122 copied files are unchanged. See [pstack setup](pstack-setup.md) for provenance and checks.
- Add the actual Job Search workstation image to its static card. Reduced-motion, no-JavaScript, model-failure, and context-loss readers can see the desk, laptop, tool tiles, and loop. The WebP is 28,338 bytes.
- Stop the WebGL scene when the browser's motion preference changes to reduced motion. Preserve the selected stop when the page switches to its static layout after motion reduction, model failure, or context loss. Reload to re-enable the live tour.

The original bust, poster, six live camera paths, sweater stickers, and hub files are unchanged.

## Design evidence

The user supplied `astra-handoff.pdf` and `intro3d-replication-spec.pdf`. The first describes the accepted six-stop tour. The second provides detailed reference observations and technical inspiration. Their prescriptions conflict on native scrolling, face decals, palette, post-processing, and asset encoding.

This continuation preserves the repository's native document scroll, sweater decals, light warm palette, and Meshopt loader. The detailed reference's emphasis on story-bearing scene objects supports the Job Search still. Its authoring UI and wheel-capture implementation are not requirements for this personal site.

For the static scene, optional `TourStop.still` metadata keeps the image and copy in one table. A separate gallery would duplicate stop ordering. The current `Mode` union remains unchanged. One `returnToStatic()` transition disposes WebGL resources, commits the static layout, and restores the current article. Unmount cleanup does not move the document.

## Verification

`npm run verify` passes ESLint and the production Next.js build.

`scripts/verify/tour.mjs` ran against `npm run start` in Google Chrome. It passed 17 checks with no browser runtime errors. The run includes six live stops at 1440 x 900 and 390 x 844, native scroll, one visible live card, reduced-motion and no-JavaScript views, runtime motion changes, context loss, direct and legacy fragments, failed and invalid GLB responses, a 390 x 568 short screen, and the unchanged hub routes and assets. Screenshots were visually inspected for the desktop desk, phone desk, static desk cards, and short-screen card.

The initial production browser run reproduced both defects. The Job Search article contained zero images in static mode. Changing the motion preference after loading left `data-mode="live"` and the canvas running at both viewport widths.

To rerun the browser checks with an available Playwright installation and Chrome:

```bash
npm ci
npm run verify
npm run start -- --port 3017
```

In another terminal, set `PLAYWRIGHT_MODULE` to an importable Playwright module path if it is not installed in the current environment:

```bash
PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs \
TOUR_URL=http://localhost:3017 \
TOUR_EVIDENCE=/tmp/meconny-verification \
node scripts/verify/tour.mjs
```

Playwright is not added to the application dependencies. The verifier writes its JSON result and screenshots into `TOUR_EVIDENCE`.

## Still open

The character's likeness is not rebuilt in this continuation. `docs/character-direction.md` records that a newer eye candidate was rejected and identifies a smiling purple-shirt selfie as the preferred identity reference. The supplied PDFs do not contain that full-resolution selfie or the editable Blender source, and those assets are not in this checkout. The existing 230,700-byte GLB has painted eyes and no authored blink animation. A technical browser pass does not establish likeness or visual approval of a replacement character.

The PR stack remains unmerged. PR #5 contains the ancestor tour, #6 promotes the tour to the homepage, and #7 adds the inherited polish. PR #4 remains a separate hub change. Production cutover, a replacement likeness, and the future of `/hub` remain separate decisions. This continuation does not claim to complete those parts of the handoff.
