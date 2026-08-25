import { site } from "@/content/site";
import { Reveal } from "@/app/components/reveal";
import { SectionHeading } from "@/app/components/section-heading";

export function Thesis() {
  return (
    <section id="about" className="border-b border-rule">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <Reveal>
          <SectionHeading
            number={site.thesis.number}
            kicker={site.thesis.kicker}
            title={site.thesis.title}
            body={site.thesis.body}
          />
        </Reveal>
        <div className="mt-14 grid gap-px bg-rule sm:grid-cols-2">
          {site.thesis.pillars.map((pillar, index) => (
            <Reveal key={pillar.title} delayMs={index * 60} className="h-full">
              <article className="h-full bg-canvas p-6 sm:p-8">
                <h3 className="font-display text-xl text-ink">{pillar.title}</h3>
                <p className="mt-3 text-sm leading-6 text-quiet">{pillar.blurb}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
