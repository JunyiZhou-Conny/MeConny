# Local editorial demo

## Prototype playbook

1. Scope the decision the prototype exists to make: which layout, which interaction, which density, or for an empirical fork which behavior, timing, or approach. No decision means no prototype. Route to Feature.
   Decide whether an editorial vertical Works section and integrated About continue the existing 3D opening.
2. Gather references when the design space is open. Search for prior art, summarize a moodboard of themes, palettes, and layouts, let the user pick directions before building. Skip when the direction is set.
   Skip. The user supplied the direction and a detailed critique.
3. Build throwaway in an isolated scratch dir, separate from production source. For a visual decision, vanilla HTML/CSS/JS or the lightest stack that renders the idea, CDN deps, a dev server with hot reload. For a behavioral or timing decision, the smallest script that exercises the question. No production framework, no tests, no abstractions.
   Isolated MeConny-demo worktree. Reuse the existing Vite/Three app because retaining the approved 3D opening is the central constraint.
4. When comparing alternatives, build them behind one switcher (buttons or a keypress), each variant labeled. This is the **exhaust-the-design-space** principle skill made cheap.
   Compare split project spreads and compact stacked project units during design. Deliver one coherent direction after browser review.
5. Verify on the matching surface. For a visual decision, screenshot each variant via the control skill and drive the interaction. For a behavioral or timing decision, observe the thing you are deciding by logging the timing, printing the output, or watching the render. The observation is the test here, not an assertion.
   Inspect desktop and phone. Exercise project covers, titles, case-study details, same-page About, /hub, and keyboard navigation.
6. Present alternatives, tradeoffs, and a recommendation. The output is the decision plus the throwaway artifact, not shippable code. Hand the chosen direction to **Feature** (or `architect` for the shape) for the real build.
   Show the local demo. No deployment or remote branch writes.

## Throughput checkpoint

- Blocking first steps. Confirm clean production source, isolate worktree, trace camera anchors, verify project sources.
- Independent workstreams. Evidence audit writes work/evidence only. About owns About.tsx and About.css. Architecture explorer writes a report. Root owns composition, Works, scene transition, and global type treatment.
- Shared mutable state. Model and production tree remain untouched. Browser-heavy checks run serially because this computer has limited memory.
- Smallest safe decomposition. One owner integrates the scroll-dependent 3D scene and page. Delegates handle independent content, About, and review.

## Data shape

Each selected project is one typed record with slug, number, domain, title, summary, year/status, technologies, source links, evidence image or documented workflow, and case-study sections. One collection drives the vertical list and expanded details. The five existing scene anchors stay intact. About is a static factual section.

## Acceptance

Model hash unchanged. Readable 16–18px body. Grain under HTML. Native vertical Works. Clickable covers and titles. Details add factual information. Integrated About and /hub route. No fake screenshots or results. Desktop and phone inspected. Local URL running. Production unchanged.
