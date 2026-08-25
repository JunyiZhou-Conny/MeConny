import { site } from "@/content/site";
import { Reveal } from "@/app/components/reveal";

export function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden border-b border-rule"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 top-8 font-display text-[clamp(8rem,28vw,18rem)] leading-none text-tide/10 select-none sm:right-10"
      >
        {site.identity.seal}
      </div>
      <div className="mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-end px-5 py-20 sm:px-8 sm:py-28">
        <Reveal>
          <p className="font-mono text-xs tracking-[0.22em] text-tide uppercase">
            MeConny
          </p>
          <h1 className="mt-5 max-w-4xl font-display text-[clamp(2.6rem,8vw,6.2rem)] leading-[0.95] font-medium tracking-tight text-ink">
            {site.identity.name}
          </h1>
          <p className="mt-6 font-mono text-sm tracking-[0.08em] text-quiet">
            {site.identity.role}
          </p>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-ink/90 sm:text-xl sm:leading-9">
            {site.identity.oneLiner}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="#work"
              className="inline-flex items-center bg-tide px-5 py-2.5 font-mono text-xs tracking-[0.14em] text-canvas uppercase no-underline transition-opacity hover:opacity-90"
            >
              View work
            </a>
            <a
              href={site.contact.links[0].href}
              className="inline-flex items-center border border-rule px-5 py-2.5 font-mono text-xs tracking-[0.14em] text-ink uppercase no-underline hover:border-tide/50"
            >
              GitHub
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
