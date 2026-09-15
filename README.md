# MeConny

Public page for [Junyi (Conny) Zhou](https://github.com/JunyiZhou-Conny).

`/` is a 3D scroll tour: six stops around a bust, one card at a time, native document scroll. Einstein is a stand-in until Conny's own figure lands.

`/hub` is the written hub — Javis Ng’s published portfolio chrome, vanilla HTML / CSS / JS from [javis603.github.io](https://github.com/Javis603/javis603.github.io), with Conny’s name, projects, and links in the same slots.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000` for the tour and `http://localhost:3000/hub` for the written hub. `/3d` redirects to `/`.

```bash
npm run verify
```

## Edit copy

Tour copy, cameras, stickers, and the Job Search workstation live in [`content/tour.ts`](content/tour.ts). The runbook is [`docs/homepage-tour.md`](docs/homepage-tour.md).

Hub copy lives in [`public/index.html`](public/index.html). Keep the existing class names (`hero-name`, `project-case`, `skill-universe`, …) so [Javis’s stylesheet](public/css/style.css) still applies. [`proxy.ts`](proxy.ts) serves that file at `/hub`.

The inventory of what the hub is allowed to say lives in [`content/site.ts`](content/site.ts). Agent rules live in [`AGENTS.md`](AGENTS.md).
