# Local demo verification

Verified `http://127.0.0.1:3023` with one headless Chrome instance at a time. No application files were changed by verification. No hosting or deployment was performed.

## Result

- Main UI pass: **155 checks passed, 0 failed**, at 1280×720, 390×844, and 375×667.
- Follow-up after the final project DOM-order refactor: **85 checks passed, 0 failed**, at the same three widths.
- Literal `#species-ot` browser reload: **2 checks passed**, desktop and phone.
- **32 screenshots** retained. All 12 project screenshots were refreshed after the final layout refactor.
- No runtime errors or browser console errors in the main pass. No runtime errors in the follow-up.

The full pass preceded the final heading → cover → description/actions DOM refactor. The targeted follow-up checked every project's geometry, horizontal overflow, keyboard order, cover activation, focus restoration, and scroll restoration after that change. Scene, routes, and modal code did not change in that refactor.

## What was observed

The opening retains the production open-eye portrait and face stickers. Both the local GLB and the HTTP-served GLB match production byte-for-byte, with SHA-256 `168a2c2bef0b549a86a5e906647dfdd62fc572863e5474af532815b09fba1f01`.

Hero body text is 17px with 26.35px line-height at desktop, and 16px with 24px line-height on both phones. Grain is contained in the scene's stacking context below the reading layer. Screenshots show clean HTML text and clean project media.

The four project units flow vertically without horizontal overflow. Project names lead, visuals remain linked to their copy, and all 36 cover/title/case-study trigger paths opened the correct detail and returned focus and scroll. Escape and the visible “Back to selected work” control both work.

The native modal correctly makes background controls inert. Tab remains within modal document content. Chrome briefly reports BODY as active when keyboard focus enters browser chrome; at that moment `document.hasFocus()` is false and the dialog still matches `:modal`. The next Tab returns to the dialog. A programmatic focus attempt on the background header was blocked. This is native browser behavior, not a background focus leak.

After the final markup change, each project's Tab order is title → cover → case-study CTA → GitHub on desktop and both phones. Desktop retains the split composition. Phone geometry is heading → image → description/actions.

All five `.tl-entry[data-point]` anchors remain. Both phone sizes were captured at the 30vh camera-stop line. The four active sticker stops retain room below their text cards. At 375×667, the smallest measured lower gap is approximately 217px. The final bridge uses the full-portrait camera stop and its card covers much of the face; this is visible in `compact-phone-story-5.png`, but does not obscure a sticker target or block navigation.

“More about me” stays in the same tab and reaches integrated About. `/hub`, `/hub/`, and `/hub.html` all normalize to `/#about`, with About positioned approximately 90px below the viewport top. Cold loading `/#species-ot` with intentionally delayed fonts leaves the target at 89.8px after fonts load. Literal reload leaves it at 89.8px on desktop and 90.1px on phone.

All displayed media loaded. All local anchor targets exist, linked local figures resolve, and every GitHub project/source link checked returned a successful HTTP response. The final reading header background prevents index or caption text from showing through behind navigation. The About role line is visible in the updated screenshot.

## Evidence

- Main script: `work/editorial-demo/verify-demo.mjs`
- Main result: `outputs/editorial-demo/verification/results.json`
- Final DOM-order script: `work/editorial-demo/verify-project-flow.mjs`
- Final DOM-order result: `outputs/editorial-demo/verification/project-flow-results.json`
- Literal reload result: `outputs/editorial-demo/verification/deep-link-refresh.json`
- Screenshots: `outputs/editorial-demo/verification/`

Key images are `desktop-hero.png`, `desktop-project-1.png`, `phone-project-1.png`, `phone-about.png`, `compact-phone-project-4.png`, the ten phone `story-*` images, and `desktop-cold-species-anchor.png`.

Two test issues were corrected before final results. The first pass used `Response.ok()` instead of the Fetch boolean `Response.ok` for the last resource check. The initial Tab test treated browser chrome as page content. The targeted keyboard follow-up also initially measured while native smooth focus scrolling was still running; its final version waits for a stable scroll position before activating the cover. These were observation issues. No application fixes were made for them.
