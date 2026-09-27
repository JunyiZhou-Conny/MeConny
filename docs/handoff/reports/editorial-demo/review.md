# Editorial demo code and content review

Reviewed 2026-09-18 against local `main`, including untracked demo files. No browser was launched for this review. The reviewer previously authored the About component; the Works, routing, typography, scene transition, and dialog integration were reviewed independently.

## Findings and disposition

### Fixed — Pediatric source link did not identify the inspected source

The initial `projects.ts` link targeted `tree/main/frontend`. The inspected repository uses `master` and keeps its frontend under `src/`. The corrected link is pinned to `9edcba81b3535c37852a89d2f6b6fac273843d6b/src`, matching the evidence audit. The corrected value was read from the actual file.

### Fixed — fully transparent hero links remained keyboard reachable

`App.tsx` faded the new hero CTA container to opacity zero after 360 pixels of scrolling without changing visibility. Root added `heroVisibility`, with the same threshold, to the actual motion container. This removes hidden controls from the tab order. The corrected implementation was inspected directly.

### Small cleanup — two stale horizontal-motion comments

The delegated Comment Sicko review identified comments at `Scene.tsx:234` and `Scene.tsx:286` describing horizontal Works phases. The implementation now settles the camera over vertical travel and renders a vertical list. Delete these two comments. No application logic change is needed.

## Content and evidence checks

- Compared project copy with `evidence.md` and the inspected public source READMEs. The Job Search OS narrative uses the current Simplify and repository workflow. It does not repeat the stale Google Sheets architecture.
- The three Pediatric interface images have exact SHA256 matches to the recorded source-rendered captures. Their captions identify the empty demo state and do not claim to show actual patient sessions.
- The speciesOT image has an exact SHA256 match to the complete source figure. Both rows and their original caveats remain in the file. The detail copy identifies the exploratory scope and avoids validated-accuracy claims.
- Research diagrams are identified as diagrams. No invented result rows, application records, metrics, or performance gains were introduced.
- Pediatric team-lead and full-stack contribution wording is supported by the source team page recorded in the evidence audit.
- About contact destinations come from `content/site.ts`. No unverified résumé link was introduced. The evidence audit identifies several résumé candidates, but their intended public version still needs a separate content decision.
- The character GLB Git blob equals `main` exactly: `17b06c61d51c0709f7a2d6eb76b507cac693a0e8`.

## Interaction and layout inspection

- The native dialog uses `showModal`, an accessible title, an initial close control, native modal focus containment, body overflow cleanup, and explicit focus restoration with `preventScroll`.
- Project cover, title, and Read case study all open the same project details. Cover visuals do not contain nested interactive controls.
- `/hub`, `/hub/`, and `/hub.html` enter the same-page About route in the application. The generated `hub.html` is a redirect document rather than another copy of the old design.
- Base styles load before component and editorial styles. The editorial rules override the old small serif hero body and translucent mobile timeline card treatment.
- Works switch to one column below 700 pixels. About switches below 760 pixels. Images preserve aspect ratio; email text may wrap; fixed navigation uses shorter mobile controls.
- Grain is contained under the content stacking context, so HTML text and project images stay clean.
- `git diff --check` passed. The earlier isolated About typecheck passed. Integrated runtime and build results remain the root agent's verification responsibility.

## Runtime checks still required

Exercise the actual demo on desktop and narrow mobile. Verify dialog Escape, backdrop close, repeated open/close, retained page scroll, focus return, hash navigation including direct `/hub`, header clearance at anchors, and no horizontal overflow. Check the scene at settled timeline stops and the transition into Works. A code review alone cannot establish those rendered outcomes.

## No-comments review accounting

Comment Sicko was delegated the exact changed-file fence. It reported the two stale comments above and no new suppressions or workaround notes. This was a read-only review, so deletion count is zero here. There were no restored comments, reruns, architecture sketches, encoding offers, encodings, or constraint exceptions. Root should remove the two stale comments before the final demo handoff.
