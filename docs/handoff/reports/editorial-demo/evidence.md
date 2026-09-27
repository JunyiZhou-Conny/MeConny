# Editorial demo project evidence

Verified 2026-09-18 from the four public GitHub repositories. App source was not changed. Repository clones live in `work/editorial-demo/sources/` outside the demo checkout.

## Ready assets

All paths below are relative to `/Users/conny/Documents/Codex/2026-09-15/i-wan/outputs/editorial-demo/evidence-assets/`.

| File | Actual content | Suggested use |
|---|---|---|
| `pediatric-source-chat.png` | Original React admin interface and source-supplied initialization greeting. 1440 × 960. | Secondary image demonstrating resident chat entry. |
| `pediatric-source-case-editor.png` | Original React Case Editor after clicking Add New Case. Empty source-defined fields. 1440 × 960. | Pediatric cover or case-study image. |
| `pediatric-source-instruction-editor.png` | Original React Instruction Editor after clicking Add New Instruction. Empty fields. 1440 × 960. | Most legible complete form. Good Pediatric primary image. |
| `speciesot-transport-umap-v08.png` | Exact public v08 research-output PNG. Two rows and three experiment cuts. 2685 × 1674. | Full image in detail with an inspect-original link. Diagram may be clearer for the main Works thumbnail. |

Pediatric images are screenshots of source code running in an isolated local harness. They are not screenshots of a live service or patient sessions. Original `AuthenticatedApp`, `ChatbotUi`, `CaseEditor`, `InstructionUi`, navigation, and styles were used unchanged. Backend requests go to a local empty fixture. No real account is authenticated. Auth0 logout and an unused type-animation dependency are inert. The source's Google Fonts were allowed to load. Other external requests were blocked. Three captures completed with no page errors.

Caption recommendation. **Interface preview rendered from the original project source. No patient data.**

Reproduce using `node work/editorial-demo/render-pediatric.mjs`. The script imports installed React/esbuild from `MeConny-live/web/node_modules` and bundled Playwright. It launches a disposable Chrome process, captures the three PNGs, and closes its browser and local server. Capture details are in `work/editorial-demo/pediatric-harness/capture.json`.

The speciesOT figure is an unchanged copy of `speciesOT/baseline/analysis/v08_transport_umaps/transport_umap_v08_panel.png`. Its generation script is `scripts/make_transport_umaps.py`. The figure demonstrates the importance of comparing raw and decoded frames. It is exploratory research output, not validated predictive accuracy. Retain the full caption, legends, and panel titles when showing it. The top row is explicitly marked misleading because raw reference cells are compared with decoded predictions. Do not use that row alone. Do not invent a simplified set of scatter coordinates or a success percentage.

Caption recommendation. **Research output from the v08 mouse-to-human experiment. Raw and decoded views reveal why the comparison frame matters.**

## Pediatric Savior

Source commit `9edcba81b3535c37852a89d2f6b6fac273843d6b`.

- [README and architecture](https://github.com/JunyiZhou-Conny/Airway-Management-Assistant/blob/9edcba81b3535c37852a89d2f6b6fac273843d6b/README.md). Lines 50–69 distinguish resident/admin roles, saved conversation history, and editable instructions. Lines 74–105 describe message handling, streaming, reset, and save. Lines 108–155 describe scenario data collection and chat history. Lines 179–212 describe Flask/MongoDB and the GPT integration.
- [Authenticated interface](https://github.com/JunyiZhou-Conny/Airway-Management-Assistant/blob/9edcba81b3535c37852a89d2f6b6fac273843d6b/src/components/AuthenticatedApp.js). Navigation exposes ChatBot to residents and the case/instruction/history tools to admins.
- [Team page](https://github.com/JunyiZhou-Conny/Airway-Management-Assistant/blob/9edcba81b3535c37852a89d2f6b6fac273843d6b/src/components/AboutPage/AboutPage.js). Credits Conny with team leadership, authentication, frontend, backend, and graphic design. Use measured language such as “Team lead; full-stack development.” Omit the source's self-praising “Best Team Lead.”
- [Case Editor](https://github.com/JunyiZhou-Conny/Airway-Management-Assistant/blob/9edcba81b3535c37852a89d2f6b6fac273843d6b/src/components/CaseEditor/CaseEditor.js). Empty source-defined case fields include Scenario Outline, Patient Report, three phases, and Final Phase. Each phase holds Expected Actions, General Description, Vitals and Conditions.
- [Instruction Editor](https://github.com/JunyiZhou-Conny/Airway-Management-Assistant/blob/9edcba81b3535c37852a89d2f6b6fac273843d6b/src/components/InstructionUi/InstructionUi.js). Admins create/edit instruction content, description, and deployment state.

Suggested copy.

**Practice a difficult conversation before the emergency.** Pediatric Savior turns pediatric airway training into a repeatable conversational simulation. Residents work through the simulator. Educators manage cases, refine instructions, and review saved conversations.

Suggested information structure.

- Context. Pediatric airway simulation, 2024. Emory/Children's Healthcare of Atlanta partnership is already present in the user's current site copy; the inspected application source independently supports Emory/Morehouse access and medical-educator collaboration.
- Contribution. Team lead, authentication, frontend, backend.
- Built. React, Flask, MongoDB, Auth0, AWS.
- Product decision. Give educators an editable case/instruction layer, with resident-facing chat kept focused.
- Limit. A training tool. Do not claim clinical outcome improvements, validated efficacy, number of trainees, or live availability.
- Primary link. `https://github.com/JunyiZhou-Conny/Airway-Management-Assistant`.

No genuine stored conversation screenshot exists in the inspected repo. Its existing image files are team portraits, arrows, and stock medical illustrations. Do not put a invented clinical dialogue inside the real screenshot.

## speciesOT

Source commit `109bf12648ec48ea679a3fbd7646752f1cf7cde4`.

- [README](https://github.com/JunyiZhou-Conny/speciesOT/blob/109bf12648ec48ea679a3fbd7646752f1cf7cde4/README.md). Lines 3–14 establish mouse-to-human transport, IMPACT_CellOT versus scGen, and that only the species leg is implemented. Lines 26–34 describe the CLI and human-submitted cluster jobs. Lines 67–83 explain that input datasets/checkpoints are absent from a fresh clone. Lines 97–106 describe decoded-frame evaluation and metric caveats.
- [Exact figure](https://github.com/JunyiZhou-Conny/speciesOT/blob/109bf12648ec48ea679a3fbd7646752f1cf7cde4/speciesOT/baseline/analysis/v08_transport_umaps/transport_umap_v08_panel.png).
- [Figure generation](https://github.com/JunyiZhou-Conny/speciesOT/blob/109bf12648ec48ea679a3fbd7646752f1cf7cde4/scripts/make_transport_umaps.py).

Suggested copy.

**Can a mouse cell tell us something useful about a human one?** speciesOT compares optimal transport with a scGen baseline in a shared autoencoder space. The work connects predictions, evaluation, and a command-line workflow so another researcher can inspect the same experiment.

Suggested labeled method diagram.

Mouse cells → shared autoencoder space → IMPACT_CellOT or scGen → predicted human cells → compare with human reference.

Small evidence strip can show actual commands `./hub list`, `./hub scorecard`, and `./hub show <run_id>`. They are documented commands, not captured run output. Label accordingly. State that the CLI prints the job chain and a human submits it.

Contribution can be framed as a research toolkit and evaluation workflow. Status is ongoing research. Avoid treatment/vaccine prediction claims; that is the stated longer-term goal rather than an implemented capability. Avoid numerical performance headline claims from the exploratory plot.

Primary link. `https://github.com/JunyiZhou-Conny/speciesOT`.

## Job Search OS

Source commit `28f5f31daea1d48c066ca8a09769d26cfb45236b`.

- [README](https://github.com/JunyiZhou-Conny/job-search-2026-2027-starter/blob/28f5f31daea1d48c066ca8a09769d26cfb45236b/README.md). Lines 3–5 define Simplify as the application ledger of record and the repo as the strategy/memory layer. Lines 20–54 describe discovery, human review, Applied/Pass decisions, and reconciliation. Lines 70–76 state explicit confirmation and manual-label protection.
- [Queue server](https://github.com/JunyiZhou-Conny/job-search-2026-2027-starter/blob/28f5f31daea1d48c066ca8a09769d26cfb45236b/scripts/serve_apply_queue.py). `/api/state` returns passed/applied state; `/api/applied` writes the ledger; `/api/pass` records decisions; SSE updates the open page when CSV state changes.

Suggested copy.

**A job search that remembers why.** A daily discovery queue brings new roles into one review flow. Applied and passed decisions return to the repository, alongside resume versions and next actions, so the next session can pick up where the last one stopped.

Suggested labeled workflow diagram.

Discover → Triage → Review queue → Human decision → Applied / Passed → Reconcile and remember.

Suggested implementation facts. Python queue server, CSV state, Cursor automation, Simplify, GitHub. Do not describe Google Sheets or Polar as the primary current architecture. The current README differs from the old portfolio copy. Do not include live application counts, company-specific pursuit status, sponsorship/work-authorization facts, transcripts, or applicant records in visuals.

Primary link. `https://github.com/JunyiZhou-Conny/job-search-2026-2027-starter`.

## scGen / CellOT autoresearch

Source commit `5d1a7d9f6dc065536ad567e7f15258c013dac3f8`.

- [README](https://github.com/JunyiZhou-Conny/scgen-cellot-autoresearch/blob/5d1a7d9f6dc065536ad567e7f15258c013dac3f8/README.md). Lines 3–12 define the fairshare-aware cluster loop and separation of planning from execution. Lines 20–23 explicitly withhold the scientific results. Lines 53–75 describe paired one-field ablations, proposer/director layers, and checkpointed agenda. Lines 82–90 describe cluster resource policy.
- [Director and substrate diagram](https://github.com/JunyiZhou-Conny/scgen-cellot-autoresearch/blob/5d1a7d9f6dc065536ad567e7f15258c013dac3f8/AUTONOMOUS_DESIGN.md). This is a design document marked partly implemented. Prefer the current README for shipped-state statements. The system explores a parameterized space; it does not invent new model code.

Suggested copy.

**Keep the experiment moving when the laptop stops.** A research director chooses the next agenda. A cluster execution layer submits, watches, and reflects on experiments within a shared resource budget. Checkpointed plans let execution continue when the planning process is offline.

Suggested labeled system diagram.

Plan next experiment → Validate configuration → Submit to SLURM → Watch → Compare and reflect → Next decision.

Place the agenda file between planning and execution. A small side note can explain that experiments change one field from a frozen baseline. Use real CLI commands as documentation, not fabricated terminal output. `python autoresearch.py --dry-run` previews the ladder. `python autoresearch.py --status` reports progress, fairshare, and queue depth.

The public README reports 338 experiments and 79.3 compute hours as of 2026-07-29. These are dated project claims, not independently rerun measurements. Prefer no numeric headline in this demo. Do not fabricate experiment rows, charts, pass/fail counts, or performance gains. Underlying study results remain unpublished.

Primary link. `https://github.com/JunyiZhou-Conny/scgen-cellot-autoresearch`.

## Resume candidate

The public Job Search OS repository contains `resumes/Perfect Resume/perfect_resume.pdf`, `resumes/Perfect Resume/JZ_Resume_2027.pdf`, and `resumes/base/JZ_resume.pdf`. These were not copied or visually inspected for this evidence task. Do not use the transcript PDFs as site assets. Pick the current intended public resume only after the root agent verifies its content and version.
