import { useEffect, useRef, useState, type Ref } from 'react'
import { PROJECTS, type Project } from '../data/projects'
import './Works.css'

function ProjectVisual({ project }: { project: Project }) {
  if (project.visual === 'clinical') {
    return (
      <div className="project-visual visual-clinical">
        <div className="visual-label">
          <span>01 / The training tool</span>
          <span>Interface preview</span>
        </div>
        <img
          src="/projects/pediatric-source-case-editor.png"
          alt="Original Pediatric Savior case editor with fields for a scenario outline and patient report"
          loading="lazy"
          width="1440"
          height="960"
        />
        <div className="visual-foot">
          <span>Prepare a case</span>
          <span>Practice a decision</span>
          <span>Review the session</span>
        </div>
      </div>
    )
  }
  if (project.visual === 'transport') {
    return (
      <div className="project-visual visual-transport">
        <div className="visual-label">
          <span>02 / Across species</span>
          <span>Research in progress</span>
        </div>
        <div className="transport-flow">
          <span>Mouse cells</span>
          <span aria-hidden="true">→</span>
          <span>Shared latent space</span>
          <span aria-hidden="true">→</span>
          <span>Human prediction</span>
        </div>
        <div className="transport-figure">
          <img
            src="/projects/speciesot-transport-umap-v08.png"
            alt="v08 repository analysis compares raw and decoded UMAP frames for mouse-to-human transport"
            loading="lazy"
            width="2685"
            height="1674"
          />
        </div>
        <div className="visual-foot">
          <span>Encode → Transport → Evaluate</span>
          <span>Original analysis</span>
        </div>
      </div>
    )
  }
  if (project.visual === 'queue') {
    return (
      <div className="project-visual visual-queue">
        <div className="visual-label">
          <span>03 / The daily workflow</span>
          <span>System diagram</span>
        </div>
        <div className="queue-top">
          <span className="queue-orbit" aria-hidden="true">
            ☾
          </span>
          <div>
            <small>Overnight</small>
            <strong>Discover & triage</strong>
          </div>
          <span className="diagram-arrow" aria-hidden="true">
            ↓
          </span>
        </div>
        <div className="queue-review">
          <div>
            <small>Your decision</small>
            <strong>Daily apply queue</strong>
          </div>
          <div className="queue-decisions">
            <span>
              Applied <span aria-hidden="true">✓</span>
            </span>
            <span>
              Pass <span aria-hidden="true">↗</span>
            </span>
          </div>
        </div>
        <div className="queue-bottom">
          <span>Decision recorded</span>
          <span aria-hidden="true">→</span>
          <span>Simplify reconciliation</span>
        </div>
        <div className="visual-foot">
          <span>Automation prepares. A person decides.</span>
        </div>
      </div>
    )
  }
  return (
    <div className="project-visual visual-research">
      <div className="visual-label">
        <span>04 / The experiment loop</span>
        <span>System diagram</span>
      </div>
      <div className="research-cycle">
        <span>
          <small>01</small>Submit
        </span>
        <span>
          <small>02</small>Watch
        </span>
        <span>
          <small>03</small>Reflect
        </span>
        <span>
          <small>04</small>Decide
        </span>
        <div className="cycle-center">
          Next
          <br />
          experiment<span aria-hidden="true">↻</span>
        </div>
      </div>
      <div className="research-ledger">
        <span>Checkpointed agenda</span>
        <span>Cluster execution</span>
      </div>
      <div className="visual-foot">
        <span>scGen / CellOT</span>
        <span>FASRC Cannon</span>
      </div>
    </div>
  )
}

function ProjectFacts({
  project,
  className,
}: {
  project: Project
  className: string
}) {
  return (
    <dl className={className}>
      {project.facts.map((fact) => (
        <div key={fact.label}>
          <dt>{fact.label}</dt>
          <dd>{fact.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function CaseStudy({
  project,
  close,
}: {
  project: Project | null
  close: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (!project) return
    const dialog = dialogRef.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog?.showModal()
    return () => {
      dialog?.close()
      document.body.style.overflow = previousOverflow
    }
  }, [project])
  if (!project) return null
  return (
    <dialog
      ref={dialogRef}
      className="case-study"
      aria-labelledby="case-title"
      onClose={close}
      onClick={(event) => {
        if (event.target === event.currentTarget) close()
      }}
    >
      <div className="case-reading">
        <div className="case-toolbar">
          <span>{project.number} / Project notes</span>
          <button onClick={close} autoFocus>
            Back to selected work <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="case-content">
          <p className="project-kicker">{project.domain}</p>
          <h2 id="case-title">{project.title}</h2>
          <p className="case-deck">{project.subtitle}</p>
          <ProjectFacts project={project} className="case-facts" />
          <div className="case-intro">
            <section>
              <h3>The question</h3>
              <p>{project.context}</p>
            </section>
            <section>
              <h3>The approach</h3>
              <p>{project.approach}</p>
            </section>
          </div>
          <h3 className="case-workflow-label">How it works</h3>
          <ol className="case-steps">
            {project.steps.map((step, index) => (
              <li key={step.title}>
                <span>0{index + 1}</span>
                <div>
                  <h4>{step.title}</h4>
                  <p>{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
          {project.visual === 'clinical' && (
            <div className="case-media">
              <figure>
                <a
                  href="/projects/pediatric-source-chat.png"
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    src="/projects/pediatric-source-chat.png"
                    alt="Original simulator chat with its source-provided Begin Simulation greeting"
                    width="1440"
                    height="960"
                  />
                </a>
                <figcaption>
                  The resident training interface. Rendered from the original
                  source with an empty demo state.
                </figcaption>
              </figure>
              <figure>
                <a
                  href="/projects/pediatric-source-instruction-editor.png"
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    src="/projects/pediatric-source-instruction-editor.png"
                    alt="Original instruction editor showing the scenario editing form"
                    width="1440"
                    height="960"
                  />
                </a>
                <figcaption>
                  Educators can adjust the simulation instructions. No patient
                  data is shown.
                </figcaption>
              </figure>
            </div>
          )}
          {project.visual === 'transport' && (
            <figure className="case-analysis">
              <a
                href="/projects/speciesot-transport-umap-v08.png"
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src="/projects/speciesot-transport-umap-v08.png"
                  alt="Full original v08 transport figure, including all legends and raw versus decoded frame caveats"
                  width="2685"
                  height="1674"
                />
              </a>
              <figcaption>
                Original repository analysis. The top row uses the raw frame;
                the bottom row uses the decoded frame. This is exploratory work,
                not a claim of validated predictive accuracy. Open the figure to
                inspect it at full size.
              </figcaption>
            </figure>
          )}
          {(project.visual === 'queue' || project.visual === 'research') && (
            <div className="case-diagram">
              <ProjectVisual project={project} />
              <p>{project.caption}</p>
            </div>
          )}
          <div className="case-source">
            <div>
              <h3>Explore the work</h3>
              <p>{project.stack.join(' · ')}</p>
            </div>
            <div>
              {project.evidence.map((link) => (
                <a
                  href={link.href}
                  key={link.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {link.label} <span aria-hidden="true">↗</span>
                </a>
              ))}
              <a href={project.repository} target="_blank" rel="noreferrer">
                View repository <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  )
}

export default function Works({ innerRef }: { innerRef: Ref<HTMLDivElement> }) {
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const open = (project: Project, trigger: HTMLElement) => {
    triggerRef.current = trigger
    setActiveProject(project)
  }
  const close = () => {
    setActiveProject(null)
    requestAnimationFrame(() =>
      triggerRef.current?.focus({ preventScroll: true })
    )
  }
  return (
    <div className="wk-gallery project-journal" ref={innerRef}>
      <section
        id="works"
        className="selected-work"
        aria-labelledby="works-title"
      >
        <div className="journal-intro">
          <p className="project-kicker">A closer look / 2024–2026</p>
          <div>
            <h2 id="works-title">
              Selected work
              <span className="handdrawn-star" aria-hidden="true">
                ✳
              </span>
            </h2>
            <p>
              Tools for practicing medicine,
              <br />
              understanding cells, and doing the next experiment.
            </p>
          </div>
          <nav className="project-index" aria-label="Selected projects">
            {PROJECTS.map((project) => (
              <a href={`#${project.id}`} key={project.id}>
                <span>{project.number}</span>
                {project.title}
                <span aria-hidden="true">↘</span>
              </a>
            ))}
          </nav>
        </div>
        <div className="project-list">
          {PROJECTS.map((project) => (
            <article
              className={`project-spread spread-${project.visual}`}
              key={project.id}
              id={project.id}
            >
              <div className="project-copy project-heading">
                <p className="project-kicker">
                  <span>{project.number}</span> / {project.domain}
                </p>
                <h3>
                  <button
                    onClick={(event) => open(project, event.currentTarget)}
                  >
                    {project.title}
                  </button>
                </h3>
                <p className="project-subtitle">{project.subtitle}</p>
              </div>
              <figure className="project-evidence">
                <button
                  className="project-cover"
                  aria-label={`View ${project.title} case study`}
                  onClick={(event) => open(project, event.currentTarget)}
                >
                  <ProjectVisual project={project} />
                  <span className="cover-open" aria-hidden="true">
                    View project ↗
                  </span>
                </button>
                <figcaption>{project.caption}</figcaption>
              </figure>
              <div className="project-copy project-description">
                <p className="project-summary">{project.summary}</p>
                <ProjectFacts project={project} className="project-facts" />
                <div className="project-actions">
                  <button
                    onClick={(event) => open(project, event.currentTarget)}
                  >
                    Read case study <span aria-hidden="true">↗</span>
                  </button>
                  <a href={project.repository} target="_blank" rel="noreferrer">
                    GitHub <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="journal-outro">
          <span>There’s a person behind the projects.</span>
          <a href="#about">
            More about me <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>
      <CaseStudy project={activeProject} close={close} />
    </div>
  )
}
