export type ProjectBadge = "Shipped" | "In progress" | "System";

export type NavItem = {
  href: string;
  label: string;
};

export type LinkItem = {
  href: string;
  label: string;
};

export type ProjectFact = {
  label: string;
  value: string;
};

export type FeaturedProject = {
  id: string;
  badge: ProjectBadge;
  period: string;
  kicker: string;
  title: string;
  summary: string;
  facts: readonly ProjectFact[];
  stack: readonly string[];
  href: string;
  hrefLabel: string;
};

export type Pillar = {
  title: string;
  blurb: string;
};

export type SkillDomain = {
  name: string;
  tools: string;
};

export const site = {
  identity: {
    name: "Junyi (Conny) Zhou",
    shortName: "Conny Zhou",
    mark: "CZ",
    seal: "周",
    role: "Health data science · Harvard / Wyss",
    oneLiner:
      "I build systems that move cells, proteins, and clinical training from experiment to something another person can run.",
    location: "Boston, MA",
  },
  nav: [
    { href: "#about", label: "About" },
    { href: "#work", label: "Work" },
    { href: "#skills", label: "Skills" },
    { href: "#contact", label: "Contact" },
  ] satisfies readonly NavItem[],
  thesis: {
    number: "01",
    kicker: "About",
    title: "Systems other people can run",
    body: "The public GitHub is a pile of course repos, lab notebooks, and forks. The work that matters is smaller: a resident-facing simulator, a cross-species transport CLI, and a cluster loop that keeps searching after the laptop sleeps. I sit in health data science. The habit is to leave a hub, a runbook, or a product.",
    pillars: [
      {
        title: "Clinical AI",
        blurb:
          "Training tools that sit next to physicians — auth, logs, and a prompt editor, not a demo chat window.",
      },
      {
        title: "Computational biology",
        blurb:
          "Transport, structure, and single-cell methods I actually run on a shared cluster.",
      },
      {
        title: "Agentic research loops",
        blurb:
          "A brain proposes the next agenda. A substrate keeps submitting if the network dies.",
      },
      {
        title: "Open methods",
        blurb:
          "CLIs, runbooks, and agent files so the next person is not starting from a notebook pile.",
      },
    ] satisfies readonly Pillar[],
  },
  work: {
    number: "02",
    kicker: "Work",
    title: "Three systems, not twenty-two repos",
    body: "Everything else stays off this page on purpose. If a repo cannot explain why it is here in one sentence, it is not here.",
    featured: [
      {
        id: "airway",
        badge: "Shipped",
        period: "2024",
        kicker: "Clinical product",
        title: "Pediatric Savior",
        summary:
          "A GPT-based rapid-cycle simulator for pediatric airway training, built with Emory Pediatrics and Children's Healthcare of Atlanta. Residents run cases. Admins edit instructions. Conversations land in a database, not a screenshot.",
        facts: [
          {
            label: "Who",
            value: "Residents on emory.edu and morehouse.edu",
          },
          {
            label: "Shape",
            value: "Chat, case editor, history, Auth0 roles",
          },
          {
            label: "Host",
            value: "React, Flask, MongoDB, AWS",
          },
        ],
        stack: ["React", "Flask", "MongoDB", "Auth0", "AWS"],
        href: "https://github.com/JunyiZhou-Conny/Airway-Management-Assistant",
        hrefLabel: "GitHub",
      },
      {
        id: "species-ot",
        badge: "In progress",
        period: "2026",
        kicker: "Current science",
        title: "speciesOT",
        summary:
          "Predict human cells from mouse cells with optimal transport in a shared autoencoder latent space. One CLI lists models, prints a scorecard, and shows the sbatch chain a human still submits. Results stay off git.",
        facts: [
          {
            label: "Question",
            value: "Does mouse→human transport close the gap?",
          },
          {
            label: "Models",
            value: "IMPACT_CellOT vs scGen",
          },
          {
            label: "Interface",
            value: "./hub list · scorecard · show",
          },
        ],
        stack: ["Python", "PyTorch", "scanpy", "CellOT", "SLURM"],
        href: "https://github.com/JunyiZhou-Conny/speciesOT",
        hrefLabel: "GitHub",
      },
      {
        id: "autoresearch",
        badge: "System",
        period: "2026",
        kicker: "Agentic loop",
        title: "scGen / CellOT autoresearch",
        summary:
          "Fairshare-aware ablation search on FASRC Cannon: submit, watch, reflect, decide. The director writes an agenda; the substrate keeps executing it. Public counts only. The science stays unpublished.",
        facts: [
          {
            label: "Loop",
            value: "338 experiments · 79.3 cluster hours",
          },
          {
            label: "Outcome",
            value: "318 completed · 20 handled failures",
          },
          {
            label: "Split",
            value: "Brain proposes · substrate runs",
          },
        ],
        stack: ["Python", "SLURM", "FASRC", "YAML policy", "LLM optional"],
        href: "https://github.com/JunyiZhou-Conny/scgen-cellot-autoresearch",
        hrefLabel: "GitHub",
      },
    ] satisfies readonly FeaturedProject[],
    supporting: [
      {
        href: "https://github.com/JunyiZhou-Conny/AlphaFold-Pipeline-for-Bou-Nader-Lab",
        label: "AlphaFold lab pipelines",
      },
      {
        href: "https://github.com/JunyiZhou-Conny/mixhvg-py",
        label: "mixhvg-py",
      },
      {
        href: "https://github.com/JunyiZhou-Conny/Structure-Verified-RLVR-for-Label-Efficient-Pathology-Instance-Segmentation",
        label: "pathology instance segmentation",
      },
    ] satisfies readonly LinkItem[],
  },
  skills: {
    number: "03",
    kicker: "Skills",
    title: "Tools I actually run",
    body: "Four domains. No keyword soup. If it is here, it has been in a repo, a cluster job, or a shipped app.",
    domains: [
      {
        name: "Computation",
        tools: "Python · PyTorch · scanpy · CellOT · AlphaFold · R",
      },
      {
        name: "Full-stack",
        tools: "React · Flask · MongoDB · Auth0 · AWS",
      },
      {
        name: "Cluster",
        tools: "SLURM · FASRC Cannon · fairshare · HPC",
      },
      {
        name: "Agents",
        tools: "Cursor · LLM directors · autonomous search loops",
      },
    ] satisfies readonly SkillDomain[],
  },
  contact: {
    number: "04",
    kicker: "Contact",
    title: "Write if the work is useful",
    body: "Collaborations, questions about a repo, or a pointer to something I should see.",
    email: "junyizhou@hsph.harvard.edu",
    links: [
      {
        href: "https://github.com/JunyiZhou-Conny",
        label: "GitHub",
      },
      {
        href: "https://www.linkedin.com/in/junyi-zhou-270208247",
        label: "LinkedIn",
      },
      {
        href: "https://mooneylab.seas.harvard.edu/people/junyi-conny-zhou",
        label: "Mooney Lab",
      },
    ] satisfies readonly LinkItem[],
  },
  footer: {
    note: "MeConny is the public hub. It is not a dump of every repository.",
    startYear: 2026,
  },
} as const;

export type Site = typeof site;
