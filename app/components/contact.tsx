import { site } from "@/content/site";
import { Reveal } from "@/app/components/reveal";
import { SectionHeading } from "@/app/components/section-heading";

export function Contact() {
  return (
    <section id="contact" className="border-b border-rule">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <Reveal>
          <SectionHeading
            number={site.contact.number}
            kicker={site.contact.kicker}
            title={site.contact.title}
            body={site.contact.body}
          />
          <a
            href={`mailto:${site.contact.email}`}
            className="mt-10 block font-display text-2xl tracking-tight text-tide no-underline hover:underline sm:text-4xl"
          >
            {site.contact.email}
          </a>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            {site.contact.links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="font-mono text-xs tracking-[0.14em] text-ink uppercase no-underline hover:text-tide"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
