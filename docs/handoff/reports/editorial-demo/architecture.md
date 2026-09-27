# Local editorial demo architecture

## Recommendation

Build a continuous vertical project journal. Keep the existing 3D opening and five camera stops, then let a short transparent transition introduce an ivory reading surface. Use sage, warm gray, the existing handwritten display face, and clear sans-serif body copy across Works and About. The first complete Pediatric Savior unit is the design proof. Apply its hierarchy to the other three projects only after inspecting it at desktop and phone sizes.

The design decision is whether visitors understand Conny's work more easily through complete vertical project units and an integrated About section. The user has already set this direction, so further moodboard approval is unnecessary. The prototype skill calls for cheaply comparing alternatives in isolated scratch space. No deployment, production edits, or PR are needed.

## Two feasible options

### A. Continuous project journal — recommended

A slim Works introduction starts over the existing scene. After roughly half a viewport, an opaque warm-paper field becomes the reading background. Each project has one generous row, containing a small domain tag, a large actual project name, a concise purpose statement, an evidence-based visual, and a clear case-study link. A narrow number column and hairline separators create rhythm without enclosing everything in identical cards. Pediatric Savior can be the lead project, with a larger actual interface crop. The other projects can use source-backed workflows and real output figures. All four still receive complete, individually recognizable units.

Desktop rows use an approximately 45/55 text/visual split. The visual order stays consistent rather than alternating every row. Phone rows stack name, summary, visual, and links. About is a continuation of the same paper surface. Use small sage patches and dark output panels as local accents. Do not use full-height category panels, forced screen-sized cards, or horizontal scroll mapping.

Case-study cover, title, and explicit CTA open the same detailed reading surface. A native `dialog` with `showModal()` is a low-dependency way to provide focus containment, background inertness, and Escape behavior. Match its colors and type to Works. It must add context beyond the cover: problem, contribution, implementation/workflow, evidence, and an honest current status. Close restores focus to the exact trigger and preserves scroll. A visible text label such as “Back to selected work” is clearer than an isolated ×. Alternatively, use inline `details` if the authored material is short; the visitor should not enter an overlay just to read three paragraphs.

Tradeoff: the 3D character becomes a supporting introduction instead of occupying the entire work-reading phase. This is compatible with the critique and removes visual competition where dense evidence needs attention.

### B. Sage reading room with portrait/index sidebar

A two-column Works section keeps a small portrait or chapter index on the left and a continuous paper project stream on the right. On desktop, the sidebar can remain `position: sticky` for the Works section. The right column contains actual project names, visuals, short outcomes, and always-visible repository links. Selecting a project opens an in-place expanded section rather than a fullscreen takeover. On phones, remove stickiness, collapse the sidebar to a small introductory header, and present the same vertical stream.

Tradeoff: stronger visible connection with the portrait, but considerably narrower screenshots and more complex camera/DOM alignment. A scene that fills a fixed viewport cannot reliably act as a compact sidebar without a new framing contract. Use this only if visual inspection proves the portrait is useful beside the evidence. Do not add another WebGL Canvas just to make the sidebar work.

A is lower risk and gives actual project material enough room. B is useful as the cheap alternate layout to compare in the scratch demo, but should not be the default if it compromises readability.

## Existing scroll contracts to preserve

- `web/src/data/focusPoints.ts` provides five GLB anchors, `focus-1` through `focus-5`, and 50 frames per node. The first camera sequence spans frames 0–250. Removing or reordering timeline entries without changing the GLB contract will break correspondence.
- `Resume.tsx` renders each `.tl-entry` with the matching `data-point`, and a content-height `.tl-body` inside it. Keep these names and the order for this demo.
- `Scene.tsx` samples those DOM top positions on each animation frame. A timeline top reaching 30% of the viewport locks its camera stop. It does not depend on fixed absolute scroll values. Typography changes can therefore move stops safely, subject to visual inspection.
- Desktop entry spacing comes from `padding-bottom: 46vh`; the final entry has `38vh`, and the containing resume has `20vh` bottom padding. Keep enough clearance between the final camera stop and the Works marker to avoid beginning the Works transition before the final stop settles.
- Mobile framing uses the measured `.tl-body` and `.tl-entry` heights to fit the active face sticker below the text. Do not replace `.tl-body` with a differently named wrapper or include decorative trailing spacing inside it. Longer copy reduces the available sticker gap; use concise focus copy and inspect 375×667 as well as 390×844.
- The scene discovers `.wk-gallery`. It starts Works mode when that element enters the viewport, moves frames 250–300 as its top goes from viewport-bottom to viewport-top, then uses the next `window.innerWidth` pixels to reach the last camera frame. This final width-based phase belongs to horizontal scrolling and must be replaced for the new layout.
- A simple vertical replacement can map the first viewport of Works entry to 250–300, then a short fraction of viewport height to the final frame and hold. Better still, inspect frames 250/300/final and stop at the most composed pullback frame while the paper surface covers the rest. Preserve forward/back reversibility. Do not stretch camera motion over the entire four-project reading section.
- The existing `focus-works` node also drives depth of field once Works is in view. Do not rely on the character being legible behind the reading surface; keep that surface opaque where text and screenshots appear.

## Grain and contrast

`NoiseOverlay.tsx` currently hardcodes `zIndex: 100`, while `.content` is 10 and the detail dialog is 70. It literally sits above every text and screenshot. Move it below the HTML reading layer, ideally inside the scene's own stacking context. Do not try to compensate with heavier text or more text-shadow. The scene itself can retain its texture.

The current hero paragraph is `clamp(8px, 1.05vw, 16px)` with 1.2 line-height and a thin serif. Use approximately 17px/1.55 sans-serif for the actual introduction, with a stable subtle dark-green gradient or panel directly behind that text. Preserve the handwritten headline. Keep the copy short enough that the larger paragraph does not crowd the face on 375px phones. Auxiliary metadata can be 12–13px with higher contrast; it does not need exaggerated tracking.

The existing fixed `.scrim`, `.glass-rail`, and `.stage-fog` are below `.content` and can remain scene treatments, but replace the Works-only blue/black darkening with a sage transition if it is still visible. An opaque paper Works background then creates consistent screenshot and text contrast.

## Navigation and accessibility details

- Same-page navigation needs real anchors: `#works`, `#about`, and `#contact` if distinct. Add a short consistent header/navigation once it is useful. Use visible focus styles and 44px hit targets.
- `Resume.tsx` currently opens every group link with `target="_blank"`. The new “More about me” link must use `href="#about"` and no new-tab target.
- If cover, title, and CTA are separate triggers, make all three work and give the cover an accessible name such as “Read Pediatric Savior case study”. Avoid nested interactive elements.
- Existing WorkDetail has neither dialog semantics nor a focus trap. Reusing its current markup without fixing these would carry forward a functional defect. Native `dialog` or a deliberate accessible dialog implementation is preferable.
- If overlay content has internal scroll, keep the close/back control visible. Returning must retain Works position and focus.
- Respect reduced motion for new UI fades, smooth anchor scrolling, and camera-transition additions. Do not introduce motion just to announce each project card.
- A local `/hub` visit should resolve to the new About. Vite dev/preview SPA fallback can serve App, which can normalize the path to `/#about` before scrolling after mount. Also account for `/hub/` and `/hub.html` if offering these locally.
- `web/package.json` has `postbuild: node scripts/copy-hub.mjs`, which copies the old portfolio to `dist/hub.html`. Updating only App leaves a built legacy route available. In the isolated demo, replace that generated page with a tiny redirect to `/#about` while preserving the license-copy operations in the script. Do not touch production Vercel settings.

## Demonstration checks

Inspect the actual local demo at 1280×720, a larger desktop, 390×844, and 375×667. Confirm body text size/line-height, all five settled camera stops, visible face stickers, the transition at Works, and no horizontal overflow. Scroll naturally through all four project units. Activate each cover, heading, and CTA, then use both keyboard Escape and visible Back; check focus and scroll restoration. Navigate About from the hero/timeline and visit `/hub` directly. Verify project media is legible, not cropped beyond meaning, and accurately described. Keep the exact production GLB unchanged.
