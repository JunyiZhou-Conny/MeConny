# pstack in Codex

All 47 skills from `cursor/plugins` are copied into `.agents/skills/` with their original folder names and contents. No existing skills were skipped. The installation includes poteto-mode's 23 playbooks, references, and scripts.

The source revision is `c1c0a32802223f4be824112dd83d33ad29a8b26c`. `.agents/pstack-installation.json` records a SHA-256 digest for every copied file. No Cursor plugins monorepo is vendored into MeConny.

To use poteto-mode, ask Codex to apply `.agents/skills/poteto-mode/SKILL.md`. Its bundled Session pickup and Feature playbooks guide the handoff work. AGENTS.md contains the user's requested activation paragraph.

## Codex runtime

The upstream files describe Cursor tools, agent types, and model defaults. Those names are not executable Codex commands. This installation preserves them verbatim as requested. In Codex, use the available collaboration tools for delegation, shell tools for file work, and browser tools for UI verification. Record unavailable capabilities instead of claiming to run them. Do not run Cursor `/add-plugin`.

The current session read the installed skills directly. A subsequent task opened in this repository can discover them under `.agents/skills/`. Installing files does not change the skill catalog of a task that was already open outside this repository.

The app's TypeScript and ESLint configurations exclude `.agents/`. This keeps the skills' Bun utilities and orchestration tests out of the Next.js application build without modifying those utilities.

## Verify the copy

Run from the repository root:

```bash
python3 - <<'PY'
import hashlib
import json
from pathlib import Path

manifest = json.loads(Path('.agents/pstack-installation.json').read_text())
root = Path(manifest['destinationDirectory'])
for name in manifest['installed']:
    assert (root / name / 'SKILL.md').is_file(), name
for relative, expected in manifest['sha256'].items():
    assert hashlib.sha256((root / relative).read_bytes()).hexdigest() == expected, relative
print(f"Verified {len(manifest['installed'])} skills and {len(manifest['sha256'])} files.")
PY
```
