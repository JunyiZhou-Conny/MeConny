import { site } from '../../../content/site'
import './About.css'

const interests = [
  'Clinical AI',
  'Computational biology',
  'Research workflows',
  'Open methods',
]

export default function About() {
  return (
    <section
      className="about-conny"
      id="about"
      tabIndex={-1}
      aria-labelledby="about-title"
    >
      <div className="about-conny-inner">
        <div className="about-conny-heading">
          <p className="about-conny-eyebrow">Beyond the projects</p>
          <h2 id="about-title">
            A little more
            <br />
            about me.
          </h2>
          <div className="about-conny-coordinate">
            <span aria-hidden="true">周</span>
            <p>
              {site.identity.name}
              <br />
              {site.identity.location}
            </p>
          </div>
          <p className="about-conny-affiliation">{site.identity.role}</p>
        </div>

        <div className="about-conny-story">
          <p className="about-conny-intro">
            I work in health data science, connecting clinical AI, computational
            biology, and the tools that help research keep moving.
          </p>
          <p>
            That work takes different forms: a simulator for pediatric airway
            training, methods for moving between mouse and human cell data, or
            experiments running on a shared cluster.
          </p>
          <p>
            The common thread is the handoff. I want an experiment to become
            something another person can understand, run, and build on.
          </p>

          <div className="about-conny-notes">
            <div>
              <h3>What I think about</h3>
              <ul className="about-conny-interests">
                {interests.map((interest) => (
                  <li key={interest}>{interest}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>How I work</h3>
              <p>
                Build the tool. Run the experiment. Leave a clear path for the
                next person, through a working interface, a command-line tool,
                or a runbook.
              </p>
            </div>
          </div>

          <nav className="about-conny-links" aria-label="More about Conny">
            {site.contact.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label}
                <span aria-hidden="true"> ↗</span>
                <span className="about-conny-sr-only">
                  {' '}
                  (opens in a new tab)
                </span>
              </a>
            ))}
          </nav>
        </div>

        <footer className="about-conny-contact" id="contact">
          <div>
            <p className="about-conny-eyebrow">Have something in mind?</p>
            <a
              className="about-conny-email"
              href={`mailto:${site.contact.email}`}
            >
              {site.contact.email}
              <span aria-hidden="true"> ↗</span>
            </a>
            <p className="about-conny-invitation">
              Collaborations, a question about the work, or something I should
              see.
            </p>
          </div>
          <a className="about-conny-top" href="#start">
            Back to top <span aria-hidden="true">↑</span>
          </a>
        </footer>
      </div>
    </section>
  )
}
