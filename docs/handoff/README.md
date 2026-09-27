# Cloud handoff — 2026-09-27

**The next task is to continue the website design described in [NEXT-AGENT.md](NEXT-AGENT.md). The handoff documents are already committed.**

Everything required to recover the latest demo is in this branch. No Mac path, local ZIP, or original agent session is required.

## What is on this branch

- Branch: `claude/website-handoff-docs-sx9xp0` in `JunyiZhou-Conny/MeConny`.
- Base: production `62749f90f3ff1af836366c1a2f2361e4f264f8a5`.
- This commit adds handoff material and a branch-specific deployment guard. **The demo patch has not yet been applied to `web/`.**
- [patches/editorial-demo.patch](patches/editorial-demo.patch) contains all 18 changed/new demo files, including four PNG images. The accepted model and other unchanged assets already exist in this repository.
- [SOURCE-MANIFEST.json](SOURCE-MANIFEST.json) records all 105 files in the original demo snapshot. The patch plus the base commit restores them exactly.
- [HANDOFF.zh-CN.md](HANDOFF.zh-CN.md) explains production, GitHub, deployment, design history, asset provenance, and remaining work. Its opening note distinguishes this GitHub delivery from the earlier local ZIP.

## Get this handoff into an existing cloud checkout

If your current branch is already `claude/website-handoff-docs-sx9xp0` and has no local changes:

```bash
git fetch origin claude/website-handoff-docs-sx9xp0
git merge --ff-only origin/claude/website-handoff-docs-sx9xp0
```

If fast-forward fails or you have local work, inspect the divergence and preserve it. Do not reset or overwrite changes to force these instructions through.

A fresh checkout can use:

```bash
git clone --branch claude/website-handoff-docs-sx9xp0 https://github.com/JunyiZhou-Conny/MeConny.git
cd MeConny
```

## Recover and run the demo

Run from the repository root before editing application files:

```bash
python3 docs/handoff/verify-restoration.py
git apply --check docs/handoff/patches/editorial-demo.patch
git apply docs/handoff/patches/editorial-demo.patch
npm ci --prefix web
npm run dev --prefix web -- --host 0.0.0.0 --port 3023 --strictPort
```

Use **Node.js 24**. Open port 3023 through your cloud development environment's normal preview. This runs a development server; do not create a Vercel deployment. On a local machine you can bind `127.0.0.1` instead. The original `DEMO.md` describes a Mac dependency symlink; this cloud checkout instead installs dependencies with `npm ci --prefix web`.

The verifier reconstructs the demo in a temporary directory and compares all 105 hashes. It does not modify your working tree. Apply the patch once; if it fails, inspect the current files rather than forcing or repeatedly applying it.

After applying the patch, the root application's intended changes match the original demo. This branch additionally retains `docs/handoff/`, the link in `docs/publication.md`, and the Vercel deployment guard; those handoff additions are not part of the original snapshot.

## Continue design work

Read [NEXT-AGENT.md](NEXT-AGENT.md), inspect the running demo, and then improve `web/` in small steps. Preserve the approved open-eye character and the five camera stops.

Important entry points:

- `web/src/data/projects.ts`: new project content and evidence.
- `web/src/ui/Works.tsx` and `Works.css`: vertical project layout and dialogs.
- `web/src/ui/About.tsx` and `About.css`: integrated About.
- `web/src/editorial.css`, `App.tsx`, `Resume.tsx`: type, layout, navigation, story.
- `web/src/scene/Scene.tsx`: camera/scroll interaction and transition into Works.

The root `AGENTS.md` still includes production-era references to `works.ts`, horizontal Works, and the legacy hub. For this explicitly requested demo redesign, the current user direction and this handoff explain the intended changes. Root Next.js files remain archived.

## Validation

```bash
npm run lint --prefix web
npm run build --prefix web
```

Then inspect desktop and 375×667 mobile behavior, all five camera stops, project covers and titles, dialogs, Escape, keyboard focus, scroll restoration, and About links. Adapt the historical browser scripts' Mac paths and Playwright import before using them in a cloud container.

Root `npm run verify` still invokes the old source-hash/hub publication contract. The independent `web/scripts/verify-reference.mjs` also assumes the previous horizontal gallery. Both need intentional updates before a future release; do not delete checks merely to make the result pass.

Historical test results date to September 17/18. They are not proof that subsequent cloud edits pass. [VERIFICATION.md](VERIFICATION.md) describes what was checked for this transfer.

## What is included and what stays in the local archive

| Included here | Location |
| --- | --- |
| Complete demo payload and source hashes | `patches/`, `SOURCE-MANIFEST.json` |
| Main and next-agent instructions | `HANDOFF.zh-CN.md`, `NEXT-AGENT.md` |
| 32 demo screenshots, browser JSON and four source-backed images | `evidence/editorial-demo/` |
| Design decisions, pinned project sources, reviews and historical scripts | `reports/editorial-demo/` |
| September 27 deployment/source audit | `reports/current-audit/` |
| Last open-eye release report | `reports/open-eye-release.md` |
| Complete 47 pstack skill directories | `workflow/pstack-skills/` |
| Accepted model, prepared character, reference, decals and rebuild tools | Already in root `web/`, `assets/portrait/`, `docs/portrait/` |

The earlier 69 MB ZIP, duplicate source snapshot, raw 21.7 MB generation output, upstream original-person GLB, original critique PDFs, and complete old production screenshot archive are not committed here. They are unnecessary for recovering this demo. Their old Mac paths in historical reports are archival references, not available cloud files. No `.env`, account token, `node_modules`, build output, or Git worktree pointer is included.

To use poteto-mode, copy each skill directory from `docs/handoff/workflow/pstack-skills/` into repository-root `.agents/skills/`, skipping an existing same-name skill and preserving all files. Merely storing them under docs does not make Codex auto-discover them.

## Deployment boundary

User authorization now includes **pushing this handoff to the named branch**. Website publication remains unapproved.

`vercel.json` contains:

```json
"git": {
  "deploymentEnabled": {
    "claude/website-handoff-docs-sx9xp0": false
  }
}
```

This uses Vercel's [documented per-branch control](https://vercel.com/docs/project-configuration/git-configuration#git.deploymentEnabled). Keep it while working on this branch. It does not disable deployments from main or other unspecified branches, so another branch name must not be assumed safe to push without checking its deployment behavior and user authorization. Do not deploy manually, merge main, or initiate paid model generation as part of this handoff.
