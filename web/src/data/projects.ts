export interface Project {
  id: string
  number: string
  domain: string
  title: string
  subtitle: string
  summary: string
  status: string
  stack: string[]
  facts: { label: string; value: string }[]
  repository: string
  visual: 'clinical' | 'transport' | 'queue' | 'research'
  caption: string
  context: string
  approach: string
  steps: { title: string; description: string }[]
  evidence: { label: string; href: string }[]
}

export const PROJECTS: Project[] = [
  {
    id: 'pediatric-savior',
    number: '01',
    domain: 'Clinical AI',
    title: 'Pediatric Savior',
    subtitle: 'A place to practice critical decisions.',
    summary:
      'A pediatric airway simulator built with Emory Pediatrics and Children’s Healthcare of Atlanta. Residents practice cases. Educators shape the training.',
    status: 'Shipped · 2024',
    stack: ['React', 'Flask', 'MongoDB', 'Auth0', 'AWS'],
    facts: [
      { label: 'Role', value: 'Team lead · full-stack development' },
      { label: 'Built for', value: 'Residents and pediatric educators' },
      { label: 'Built with', value: 'React · Flask · MongoDB · Auth0 · AWS' },
      { label: 'Status', value: 'Shipped · 2024' },
    ],
    repository:
      'https://github.com/JunyiZhou-Conny/Airway-Management-Assistant',
    visual: 'clinical',
    caption:
      'Original interface, rendered from project source. Empty demo state, no patient data.',
    context:
      'Pediatric airway management is a setting where decisions matter and opportunities to practice are limited. This project brings rapid-cycle simulation into a conversational training tool for residents.',
    approach:
      'I led the team and worked across authentication, frontend, and backend development. The application pairs resident-facing simulation with editable cases, instructions, and conversation history for educators.',
    steps: [
      {
        title: 'Prepare a case',
        description:
          'Educators use the case editor to structure the scenario outline, basic information, and history.',
      },
      {
        title: 'Run the simulation',
        description:
          'A resident begins a training conversation through the chatbot interface.',
      },
      {
        title: 'Review and refine',
        description:
          'Conversation history and the instruction editor support reviewing sessions and adjusting the training setup.',
      },
    ],
    evidence: [
      {
        label: 'Read the project README',
        href: 'https://github.com/JunyiZhou-Conny/Airway-Management-Assistant#readme',
      },
      {
        label: 'Explore the frontend source',
        href: 'https://github.com/JunyiZhou-Conny/Airway-Management-Assistant/tree/9edcba81b3535c37852a89d2f6b6fac273843d6b/src',
      },
    ],
  },
  {
    id: 'species-ot',
    number: '02',
    domain: 'Computational biology',
    title: 'speciesOT',
    subtitle: 'What can mouse cells tell us about human cells?',
    summary:
      'A research workflow for cross-species prediction. Optimal transport and scGen are compared in a shared latent space, with explicit checks on how results are measured.',
    status: 'Research in progress',
    stack: ['Python', 'PyTorch', 'scanpy', 'CellOT', 'SLURM'],
    facts: [
      { label: 'Question', value: 'Mouse-to-human cell transport' },
      { label: 'Method', value: 'IMPACT_CellOT vs. scGen in a shared latent space' },
      { label: 'Output', value: 'Research toolkit and evaluation workflow' },
      { label: 'Status', value: 'Research in progress' },
    ],
    repository: 'https://github.com/JunyiZhou-Conny/speciesOT',
    visual: 'transport',
    caption:
      'Workflow diagram with the public repository’s v08 transport analysis.',
    context:
      'Translating a response between species is a modeling question and a measurement question. speciesOT studies mouse-to-human transport while keeping the comparison between model families inspectable.',
    approach:
      'Cells are encoded into a shared representation. The workflow fits transport models, decodes predictions, and compares outputs in a consistent frame. The hub CLI organizes models, scorecards, and the cluster job chain.',
    steps: [
      {
        title: 'Encode',
        description:
          'Bring mouse and human cell data into a shared autoencoder latent space.',
      },
      {
        title: 'Transport',
        description:
          'Compare IMPACT_CellOT and scGen approaches to cross-species prediction.',
      },
      {
        title: 'Evaluate',
        description:
          'Inspect decoded predictions and guardrail metrics. A raw-versus-decoded mismatch can change how a result appears.',
      },
    ],
    evidence: [
      {
        label: 'Read the workflow and scope',
        href: 'https://github.com/JunyiZhou-Conny/speciesOT#readme',
      },
      {
        label: 'Open the full analysis figure',
        href: '/projects/speciesot-transport-umap-v08.png',
      },
    ],
  },
  {
    id: 'job-search-os',
    number: '03',
    domain: 'Agent systems',
    title: 'Job Search OS',
    subtitle: 'A workflow that remembers the decision.',
    summary:
      'Discovery, a daily apply queue, and a record of what happens next. Automation prepares the work; a person reviews each opportunity and decides how to act.',
    status: 'Shared toolkit · 2026',
    stack: ['Python', 'Cursor', 'Simplify', 'CSV'],
    facts: [
      { label: 'Method', value: 'Overnight discovery, daily human review' },
      { label: 'Record', value: 'Simplify is the application ledger' },
      { label: 'Output', value: 'A starter toolkit others can copy' },
      { label: 'Status', value: 'Shared toolkit · 2026' },
    ],
    repository:
      'https://github.com/JunyiZhou-Conny/job-search-2026-2027-starter',
    visual: 'queue',
    caption:
      'Workflow diagram based on the current repository. No personal applications shown.',
    context:
      'A job search accumulates decisions across listings, applications, resume versions, and follow-ups. This toolkit keeps that context connected so discovery does not become another disconnected list.',
    approach:
      'Overnight discovery creates a triaged queue. The local interface gives each role an Applied or Pass decision. Simplify is the application ledger of record, while the repository keeps strategy, context, and next actions.',
    steps: [
      {
        title: 'Discover overnight',
        description:
          'Triage job-board entries into dated discovery packs and a daily inbox.',
      },
      {
        title: 'Review the queue',
        description:
          'Read a role, apply through Simplify, and record Applied, or choose Pass. Decisions persist in the repository.',
      },
      {
        title: 'Reconcile weekly',
        description:
          'Import a Simplify export, deduplicate applications, validate records, and review the dashboard.',
      },
    ],
    evidence: [
      {
        label: 'Read the daily workflow',
        href: 'https://github.com/JunyiZhou-Conny/job-search-2026-2027-starter#the-one-hour-daily-loop',
      },
      {
        label: 'Set up a personal copy',
        href: 'https://github.com/JunyiZhou-Conny/job-search-2026-2027-starter/blob/main/docs/collaborators/SETUP.md',
      },
    ],
  },
  {
    id: 'autoresearch',
    number: '04',
    domain: 'Research infrastructure',
    title: 'Autoresearch',
    subtitle: 'Keep the next experiment moving.',
    summary:
      'A fairshare-aware experiment loop for scGen and CellOT on FASRC Cannon. It submits runs, watches results, and turns the evidence into the next research agenda.',
    status: 'Research system · 2026',
    stack: ['Python', 'SLURM', 'FASRC Cannon'],
    facts: [
      { label: 'Method', value: 'One-field ablations from a frozen baseline' },
      { label: 'Runs on', value: 'FASRC Cannon, within fairshare limits' },
      { label: 'Results', value: 'Unpublished' },
      { label: 'Status', value: 'Research system · 2026' },
    ],
    repository: 'https://github.com/JunyiZhou-Conny/scgen-cellot-autoresearch',
    visual: 'research',
    caption:
      'System diagram from the public implementation. Research results remain unpublished.',
    context:
      'Research on a shared cluster needs more than a script that submits jobs. It needs a way to respect resource limits, recover from failures, compare experiments, and decide what to try next.',
    approach:
      'The director proposes an agenda and checkpoints it before execution. The cluster runner keeps following that agenda if the director is offline. Paired ablations change one field from a frozen baseline so comparisons stay interpretable.',
    steps: [
      {
        title: 'Submit and watch',
        description:
          'Schedule work under cluster policy, monitor progress, and handle failed runs.',
      },
      {
        title: 'Reflect and compare',
        description:
          'Review the experiment outputs and record findings against the frozen baseline.',
      },
      {
        title: 'Decide and continue',
        description:
          'Choose admissible next experiments, checkpoint the agenda, and continue within the resource budget.',
      },
    ],
    evidence: [
      {
        label: 'Read the system design',
        href: 'https://github.com/JunyiZhou-Conny/scgen-cellot-autoresearch/blob/main/AUTONOMOUS_DESIGN.md',
      },
      {
        label: 'Explore the implementation',
        href: 'https://github.com/JunyiZhou-Conny/scgen-cellot-autoresearch#layout',
      },
    ],
  },
]
