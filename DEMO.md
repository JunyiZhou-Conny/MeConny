# Editorial portfolio demo

This design demo starts from the approved open-eye release, commit `62749f9`. It has not been deployed. The handoff branch `claude/website-handoff-docs-sx9xp0` disables automatic Vercel deployments; production `main` is unchanged.

## Run locally

Use Node.js 24.

```bash
npm ci --prefix web
npm run dev --prefix web -- --host 127.0.0.1 --port 3023 --strictPort
```

Open `http://localhost:3023/`. In a cloud container, bind `0.0.0.0` and use the environment's port preview instead of creating a hosted deployment.

## Review the direction

The 3D model and its first five camera stops are retained. Introductory copy uses one readable sans-serif stack on a stable paper background. Grain stays below the HTML content. On phones, the fifth story card settles near the bottom of the screen so the pulled-back portrait keeps its face in view.

Works is a vertical sequence of four projects. Each project has a clickable title, cover, and case-study button, plus a short facts list (role or method, output, status) for scanning. The native dialog repeats those facts, adds context, implementation details, and source links. Closing restores focus and the reading position.

About continues the same page. Local `/hub`, `/hub/`, and `/hub.html` lead to `/#about`. No Vercel settings or domain associations were changed.

## Content and evidence

`web/src/data/projects.ts` holds project copy, facts, and source links. `web/src/ui/Works.tsx` renders covers and details. `web/src/ui/About.tsx` draws factual identity and contact data from `content/site.ts`. Every project fact comes from `docs/handoff/reports/editorial-demo/evidence.md`.

Pediatric Savior images show original React components rendered with empty local fixtures. They contain no patient data and do not connect to the clinical backend. The speciesOT figure is the complete public v08 transport analysis. It is exploratory research, not a validated accuracy claim. Job Search OS and Autoresearch use diagrams based on their public implementations.

No resume button was added because an intended current public resume was not selected. GitHub, LinkedIn, the Mooney Lab profile, and email remain available.

## Browser checks

`web/scripts/verify-demo.mjs` drives the running dev server at desktop, wide, phone, and compact-phone sizes. It checks the five camera stops, the stop-5 portrait space on phones, project order and facts, dialog focus and scroll restoration, About, `/hub` routes, and the accepted GLB hash. See the header of the script for its environment variables.

This is a design prototype. Review the direction before promoting any part of it to production. `npm run verify` and `web/scripts/verify-reference.mjs` still describe the previous homepage contract.
