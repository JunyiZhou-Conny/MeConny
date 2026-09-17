# MeConny

Junyi (Conny) Zhou's personal website at [connyzhou.com](https://connyzhou.com).

The homepage is the standalone Vite application in [`web/`](web). It uses Conny's wink and peace-sign character in the reference scene from [Sen Zheng's 3D résumé](https://github.com/dayinji/sen-3d-resume). The scene's camera, lighting, effects, and scrolling configuration remain unchanged.

The written portfolio stays at `/hub`. Its HTML and assets remain in [`public/`](public), with Conny's words in [Javis Ng's published layout](https://github.com/Javis603/javis603.github.io). The build copies those files into the static deployment without restyling them. `/3d` redirects to the homepage.

## Run

Use Node.js 24. Install the frontend package, then start it from the repository root.

```bash
npm ci --prefix web
npm run dev
```

Vite starts at `http://localhost:5173`. To build and check the production output:

```bash
npm run verify
npm run preview --prefix web -- --host 127.0.0.1 --port 3021 --strictPort
```

The Vite preview serves the homepage and `/hub.html`. The production `/hub` rewrite and redirects are defined in [`vercel.json`](vercel.json); verify those on the Vercel preview.

## Edit

- Homepage introduction lives in [`web/src/App.tsx`](web/src/App.tsx).
- Five focus entries live in [`web/src/ui/Resume.tsx`](web/src/ui/Resume.tsx).
- Projects live in [`web/src/data/works.ts`](web/src/data/works.ts) and [`web/src/content/works/`](web/src/content/works).
- The model and embedded shirt decals live in [`web/public/models/me.glb`](web/public/models/me.glb). Its preparation script and placement data live in [`web/scripts/`](web/scripts).
- The hub's copy lives in [`public/index.html`](public/index.html). Its fact inventory remains [`content/site.ts`](content/site.ts).

MeConny is the production source of truth. The imported comparison commit is recorded in [`docs/reference/scene-contract.json`](docs/reference/scene-contract.json). Future edits happen here; deployment does not clone or fetch the other repository.

## Publish

The existing Vercel project `junyizhou-conny/me-conny` remains connected to this repository. Root [`vercel.json`](vercel.json) selects Vite, installs `web/package-lock.json`, builds `web/`, and publishes `web/dist`. It overrides the earlier Next.js build without changing the project root or domain configuration.

Work on a feature branch, inspect the generated Vercel preview, and merge the verified change into `main` to release. The custom domain keeps its existing apex-to-www redirect. See [the deployment runbook](docs/publication.md) for browser checks and rollback.

The root `app/`, `proxy.ts`, and Next.js configuration are archived implementation sources. They are not part of the public Vite build. The old Next dependencies remain isolated in the root lockfile; do not combine them with the frontend's React and Three versions.

Original scene code licensing and asset provenance are recorded in [`docs/reference/`](docs/reference). Repository instructions live in [`AGENTS.md`](AGENTS.md).
