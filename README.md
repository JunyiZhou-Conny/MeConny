# MeConny

Public hub for [Junyi (Conny) Zhou](https://github.com/JunyiZhou-Conny).

The live page is Javis Ng’s published portfolio chrome — vanilla HTML / CSS / JS from [javis603.github.io](https://github.com/Javis603/javis603.github.io) — with Conny’s name, projects, and links in the same slots.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. [`proxy.ts`](proxy.ts) and [`next.config.ts`](next.config.ts) rewrite `/` to [`public/index.html`](public/index.html).

```bash
npm run verify
```

## Go live

The host is Vercel (Hobby, $0). This checkout cannot log into your account.

Exact clicks: [`docs/go-live.md`](docs/go-live.md). Short version: [vercel.com/new](https://vercel.com/new) → Import **MeConny** → Deploy → open the `*.vercel.app` URL.

## Edit copy

Change [`public/index.html`](public/index.html). Keep the existing class names (`hero-name`, `project-case`, `skill-universe`, …) so [Javis’s stylesheet](public/css/style.css) still applies.

The inventory of what the hub is allowed to say lives in [`content/site.ts`](content/site.ts). Agent rules live in [`AGENTS.md`](AGENTS.md).
