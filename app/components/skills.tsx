import { site } from "@/content/site";
import { Reveal } from "@/app/components/reveal";
import { SectionHeading } from "@/app/components/section-heading";

export function Skills() {
  return (
    <section id="skills" className="border-b border-rule">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <Reveal>
          <SectionHeading
            number={site.skills.number}
            kicker={site.skills.kicker}
            title={site.skills.title}
            body={site.skills.body}
          />
        </Reveal>
        <div className="mt-14 grid gap-8 sm:grid-cols-2">
          {site.skills.domains.map((domain, index) => (
            <Reveal key={domain.name} delayMs={index * 50}>
              <article className="border-t border-rule pt-5">
                <h3 className="font-mono text-xs tracking-[0.16em] text-tide uppercase">
                  {domain.name}
                </h3>
                <p className="mt-3 text-base leading-7 text-ink">{domain.tools}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
