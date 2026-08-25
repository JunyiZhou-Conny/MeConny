import { site } from "@/content/site";
import { Reveal } from "@/app/components/reveal";
import { SectionHeading } from "@/app/components/section-heading";

export function Featured() {
  return (
    <section id="work" className="border-b border-rule">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <Reveal>
          <SectionHeading
            number={site.work.number}
            kicker={site.work.kicker}
            title={site.work.title}
            body={site.work.body}
          />
        </Reveal>

        <ol className="mt-16 flex flex-col gap-16">
          {site.work.featured.map((project, index) => (
            <li key={project.id}>
              <Reveal delayMs={index * 40}>
                <article className="grid gap-8 border-t border-rule pt-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                  <div>
                    <p className="font-mono text-xs tracking-[0.16em] text-quiet uppercase">
                      {project.kicker} · {project.period}
                    </p>
                    <h3 className="mt-3 font-display text-3xl tracking-tight text-ink sm:text-4xl">
                      {project.title}
                    </h3>
                    <p className="mt-4 inline-block border border-tide/30 bg-wash px-2 py-1 font-mono text-[0.7rem] tracking-[0.16em] text-tide uppercase">
                      {project.badge}
                    </p>
                  </div>
                  <div>
                    <p className="text-base leading-7 text-ink/90">
                      {project.summary}
                    </p>
                    <dl className="mt-6 grid gap-4 sm:grid-cols-3">
                      {project.facts.map((fact) => (
                        <div key={fact.label}>
                          <dt className="font-mono text-[0.68rem] tracking-[0.16em] text-quiet uppercase">
                            {fact.label}
                          </dt>
                          <dd className="mt-1 text-sm leading-6 text-ink">
                            {fact.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-6 font-mono text-xs leading-6 text-quiet">
                      {project.stack.join(" · ")}
                    </p>
                    <a
                      href={project.href}
                      className="mt-5 inline-flex font-mono text-xs tracking-[0.14em] text-tide uppercase no-underline hover:underline"
                    >
                      {project.hrefLabel} →
                    </a>
                  </div>
                </article>
              </Reveal>
            </li>
          ))}
        </ol>

        <p className="mt-16 text-sm leading-7 text-quiet">
          Also:{" "}
          {site.work.supporting.map((item, index) => (
            <span key={item.href}>
              <a href={item.href} className="text-ink underline-offset-4 hover:underline">
                {item.label}
              </a>
              {index < site.work.supporting.length - 1 ? ", " : "."}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
