# Cloud design iteration — 2026-09-27

This iteration ran in a Claude Code cloud container on `claude/website-handoff-docs-sx9xp0`. It restored the editorial demo from the handoff patch, then continued the design in `web/`. Nothing was deployed. The branch still disables automatic Vercel deployments, and `main` is untouched.

## Restoration

- `python3 docs/handoff/verify-restoration.py` passed: all 105 source files were rebuilt from `62749f9`, and every SHA-256 hash matched.
- `git apply --check` passed, and then the patch was applied once.
- The exact patch result is committed on its own as `e7d3aed`, before any design change. Reversing the patch on `e7d3aed` gives back the tree of `ff9fce5` exactly. Diffing it against `ff9fce5` shows only the original demo, and the next commit shows only this iteration.

## What changed

1. **Stop 5 on phones.** The camera pulls back to the full portrait at the fifth stop. Before this change, the last card sat at 30vh and hid the face at 375×667. On screens 760px wide or narrower, the last entry now lays out as a column with its card at the bottom. The entry top still reaches 30vh at the stop, so Scene.tsx sees the same anchor. At lock, the card top is at about 58% of the viewport on 375×667 and 390×844, and the face is clear above it. The timeline dot moves into the layout flow so it stays beside its card. The two links sit closer together to shorten the card. The desktop layout is unchanged.
2. **Scannable project facts.** Each project spread replaces the loose status/stack lines with four labelled facts: role or method, audience or record, output or stack, and status. The case-study dialog repeats them as a strip under the deck. Every value comes from `reports/editorial-demo/evidence.md`. For example, Pediatric Savior's role is "Team lead · full-stack development", the wording the evidence recommends. No role is claimed for the other three projects. The dialog kicker no longer repeats the status.
3. **Pediatric dialog media.** On wide dialogs, the two source-rendered screenshots now sit side by side instead of as two full-width, mostly empty panels. Each links to the full-size image, like the speciesOT figure. On phones, the dialog toolbar label no longer wraps.
4. **One sans-serif stack.** The hero, the story cards, Works, and About used three different fallback stacks. They matched on macOS only because Helvetica Neue came first in each. A shared `--sans` token (Helvetica Neue, Helvetica, Arial, then CJK fallbacks) now keeps Windows, Linux, and Android consistent. On macOS nothing changes.
5. **Cloud-ready browser checks.** `web/scripts/verify-demo.mjs` replaces the Mac-bound historical scripts for this demo. It takes `PLAYWRIGHT_MODULE`, `DEMO_URL`, `OUT_DIR`, `CHROMIUM_ARGS`, and `VIEWPORTS` from the environment. It is not wired into `npm run verify`.

## Verification

- `npm run lint --prefix web`: 0 errors, plus the existing Fast Refresh warning in `SocialIcons.tsx`.
- `npm run build --prefix web`: passes, with the existing large-chunk advisory.
- `npm run verify` (root) still fails at its first contract check, `web/src/scene/Scene.tsx matches the recorded scene contract`, as the handoff README predicted. The demo patch changed Scene.tsx; this iteration did not touch it. The contract was not edited, because updating it belongs to a release decision.
- Browser run: see "Browser results" below. Screenshots are in `evidence/cloud-iteration/`.

An in-page trace explained an early false alarm. Escape closes the native dialog and returns focus to the trigger at once. The browser queues the dialog's `close` event, and React releases the scroll lock and unmounts only when that event arrives. At about 1 fps, that took up to 2.3 seconds. The checks now wait for React's unmount rather than the `open` attribute. The application code is unchanged, and at normal frame rates the gap is a single task.

The container has no GPU. Chromium used SwiftShader WebGL at about 1 fps, so the checks wait for motion to settle. Frame timing, smoothness, and real-device Safari behavior were not measured.

## Browser results

Pending. The four-viewport run was still in progress when this report was first committed; its results are added in a follow-up commit.

## Design choices left for Conny

- **Stop-5 transition on phones.** At the stop, the face is now clear. As the reader keeps scrolling, the card moves up across the face for about a fifth of a screen before the Works paper covers the scene. The alternative is a card that fades as Works enters. That needs a scroll-linked opacity in `Resume.tsx`, which this iteration did not add.
- **Facts wording.** The labels differ per project (Role/Built for for Pediatric; Question/Method/Output for speciesOT) because only Pediatric has a sourced role statement. If Conny wants to state a role on the other three, only Conny can supply that fact.
- **Works entrance camera.** The existing GLB animation swings to the back of the head as the paper rises. It is unchanged here, but it is worth judging on a real device.
- **Resume link.** This is still omitted. It is waiting on Conny's choice of a current public resume.
