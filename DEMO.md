# Editorial portfolio demo

This local design demo starts from the approved open-eye release, commit `62749f9`. It has not been deployed. Production remains in the sibling `MeConny-live` checkout.

## Run locally

Use Node.js 24. Dependencies for this local worktree are linked to the existing `MeConny-live/web/node_modules` install.

```bash
npm run dev --prefix web -- --host 127.0.0.1 --port 3023 --strictPort
```

Open `http://localhost:3023/`. The server requires this computer to remain awake.

## Review the direction

The 3D model and its first five camera stops are retained. Introductory copy uses a readable sans-serif face on a stable paper background. Grain stays below the HTML content.

Works is a vertical sequence of four projects. Each project has a clickable title, cover, and case-study button. The native dialog adds context, implementation details, and source links. Closing restores focus and the reading position.

About continues the same page. Local `/hub`, `/hub/`, and `/hub.html` lead to `/#about`. No Vercel settings or domain associations were changed.

## Content and evidence

`web/src/data/projects.ts` holds project copy and source links. `web/src/ui/Works.tsx` renders covers and details. `web/src/ui/About.tsx` draws factual identity and contact data from `content/site.ts`.

Pediatric Savior images show original React components rendered with empty local fixtures. They contain no patient data and do not connect to the clinical backend. The speciesOT figure is the complete public v08 transport analysis. It is exploratory research, not a validated accuracy claim. Job Search OS and Autoresearch use diagrams based on their public implementations.

No resume button was added because an intended current public resume was not selected. GitHub, LinkedIn, the Mooney Lab profile, and email remain available.

This is a design prototype. Review the direction before promoting any part of it to production. The production verification scripts still describe the previous homepage contract.
