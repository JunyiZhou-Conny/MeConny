# Deployment / GitHub / CI handoff audit

Verified 2026-09-27 21:08–21:11 UTC by read-only GitHub API, local files, and fresh public HTTP GETs. No deployment, push, fetch, merge, or configuration change was performed. Facts: [deployment-facts.json](deployment-facts.json), [live-http-facts.json](live-http-facts.json).

## Current production

- Public site: https://www.connyzhou.com/. `https://connyzhou.com/` returns 308 to www. Homepage is HTTP200 with title `About Conny · Junyi Zhou`.
- Source of truth: https://github.com/JunyiZhou-Conny/MeConny, default branch `main`, public repository. Remote main remains `62749f90f3ff1af836366c1a2f2361e4f264f8a5`, dated 2026-09-17. No newer push is recorded. Local `MeConny-live/` is clean, on main at that exact commit.
- Production contains the user-approved open-eye character, smile, purple shirt, peace sign, and four face stickers. Current live `/models/me.glb` is 6,283,724 bytes, SHA256 `168a2c2bef0b549a86a5e906647dfdd62fc572863e5474af532815b09fba1f01`, byte-identical to the recorded production model.
- Live `/hub` still serves the old written hub, HTTP200. `/hub/` redirects 308 to `/hub`; `/3d` redirects307 to `/`. The newer vertical Works + integrated About demo is **not** production.
- Remote branch `codex/editorial-demo` does not exist (GitHub branch API404). The local demo must be handed over separately; cloning main alone does not obtain it.

Latest GitHub production deployment is `6508335903`, environment name `Production`, successful at `2026-09-17T17:23:15Z`, source62749f9. Its immutable hostname is https://me-conny-9umujg99p-junyizhou-conny.vercel.app and Vercel record is https://vercel.com/junyizhou-conny/me-conny/2RuS3ycz6eHNABiyu3aCK6NYCGiT. This hostname currently sends unauthenticated requests through VercelSSO; use the public custom domain for public review. GitHub's separate `production_environment` Boolean is false even for records named `Production`, so use the environment name, source SHA, and live verification together.

## Deployment chain, exactly

```text
MeConny feature branch / pull request
  → existing Vercel Git integration
  → Vercel Preview build + GitHub Vercel status
  → agent tests and reviews the preview
  → verified changes merged into MeConny main
  → Vercel Production build
  → existing custom-domain assignment
  → connyzhou.com → www.connyzhou.com
  → agent verifies the actual public site
```

Vercel project is `junyizhou-conny/me-conny`. Committed `MeConny-live/vercel.json` configures repository root as the entrypoint, framework `vite`, installation `npm ci --prefix web`, build `npm run build --prefix web`, output `web/dist`. Root `package.json` selects Node24.x. `web/package.json` build runs TypeScript thenVite, followed automatically by postbuild `node scripts/copy-hub.mjs`. This copies legacy hub files and scene/font licensing notices into the static output.

The actual deployed frontend is `MeConny-live/web/`: React18.3, ReactThreeFiber8, Drei9, Three0.169, TypeScript, Vite5, FramerMotion, Zustand. The old root Next.js/React19 package is archived and not installed by the deployment command. Root npm scripts delegate active dev/build/lint to web. There is no build-time fetch from `my-3d-resume` and no requirement for a local development server to keep the public website up.

Response headers show Cloudflare in front of Vercel, including Cloudflare email obfuscation in hub HTML. The inherited apex→www mapping remained in place; no DNS migration was required for the September17 release. This audit did not inspect registrar ownership, DNS dashboard settings, Vercel environment variables, or billing.

## CI and review, without overstating it

- Publishing is automated by **Vercel Git integration**, not a current GitHubActions release workflow.
- Current main has no `.github/` paths. GitHubActions still lists an old `github-pages` workflow record, but its sole historical run was a failed August25 push on `cursor/go-live-vercel-3e53`, unrelated to the current production deployment: https://github.com/JunyiZhou-Conny/MeConny/actions/runs/32905894667. Repository `has_pages` is false.
- Main's current combined commit status is success, with one `Vercel` status. Main has zero check-runs.
- PR14 reviewed head `f788854dc5a34a1656723b6259c1b14e594bb615` has successful Vercel status and successful app check-runs: `Cursor Approval Agent: Pull Request Router and Approver`, `Vercel Preview Comments`, `Cursor Bugbot`. These app checks are not evidence that lint or browser suites run as GitHubActions.
- There is no main branch protection. Branch protection API says `Branch not protected`; branch rules and repository rulesets are both empty. Do not describe release checks as technically enforced merge gates.
- `npm run verify` runs lint, build, and artifact verification. `web/scripts/verify-reference.mjs` is the separate Playwright browser suite. `web/scripts/verify-publication.mjs <url>` checks the actual hosted assets/routes. These were agent-invoked validations; Vercel's configured build does not invoke all of them automatically.
- Historical release record reports build/lint/30local artifact checks, 72public asset/route checks, and169browser checks across desktop1440×900, phone390×844, compact phone375×667, with0runtime errors and33screenshots. These are September17 evidence, **not** a full browser regression rerun today. This audit freshly rechecked the live routes and model hash only.

## Release history and source lineage

| Change | GitHub PR | Merge commit | Merged UTC |
| --- | --- | --- | --- |
| Import reference scene into production MeConny | https://github.com/JunyiZhou-Conny/MeConny/pull/12 | `4793b09e2a994e83822a7ca8cdfd251e9f7f8d9a` | 2026-09-17 16:00:18 |
| Recognize Cloudflare email obfuscation in verifier | https://github.com/JunyiZhou-Conny/MeConny/pull/13 | `611b0970c416cd235afbe8612a2e8e30c4a13b59` | 2026-09-17 16:06:15 |
| Publish approved open-eye portrait + face stickers | https://github.com/JunyiZhou-Conny/MeConny/pull/14 | `62749f90f3ff1af836366c1a2f2361e4f264f8a5` | 2026-09-17 17:22:44 |

Reference frontend came from `JunyiZhou-Conny/my-3d-resume` authoring commit `66356f85c2930a41d0c19375b34326a55bffd7a9`, merged there as `0225fc889a6614131f49f751a9d49e35169d7321`. Upstream baseline is `dayinji/sen-3d-resume` commit `c9a9fe373cde72c77ff7f2dabde17fb79dce89b3`. MeConny contains the imported frontend and later open-eye changes. That fork is reference/comparison history, not the current deployment source.

PRs2–11 remain open, representing earlier explorations or stacked branches. They were not merged as part of the production release and should not be blindly merged by the next agent.

Prior production identity for rollback/reference: main611b097, GitHubdeployment6506968498, https://me-conny-dc6zqd4vb-junyizhou-conny.vercel.app, wink modelSHA `c4f68c6670534f528d2c663cf4cc0100c8f84c4803b2f28d435e92f8e237a7f7`. This audit did not execute or test a rollback. Confirm current dashboard capabilities before any future rollback.

## Primary local documentation / evidence

Paths below are relative to `/Users/conny/Documents/Codex/2026-09-15/i-wan/`.

- `MeConny-live/docs/publication.md`: deployment boundary, commands, route behavior, licensing, release and rollback identities.
- `MeConny-live/docs/portrait/README.md`: approved portrait sources, limitations, repeatable GLB composition/calibration, mobile sticker framing.
- `MeConny-live/docs/portrait/provenance.json`: character generation and optimization hashes.
- `MeConny-live/docs/reference/scene-contract.json`: preserved scene/runtime contracts and expectedmodelhash.
- `MeConny-live/vercel.json`, root and web `package.json`, `web/scripts/copy-hub.mjs`: actual build/deployment behavior.
- `MeConny-live/web/scripts/verify-publication.mjs` and `verify-reference.mjs`: verification implementation.
- `work/live-site-next/open-eye-release.md`: exact reviewed head, stable patch, review comment, deployment and live checks.
- `outputs/live-site-next/portrait-production/results.json`: release browser results and adjacent screenshots.

A new agent should choose the local editorial demo for continuing the design critique, preserve MeConny main as the live baseline, and obtain explicit user authorization before publishing the demo. The most recent design request explicitly asked for local review without hosting. No further deployment is authorized by this handoff request itself.
