import { site } from "@/content/site";

export function Footer() {
  const year = new Date().getFullYear();
  const yearText =
    year > site.footer.startYear
      ? `${site.footer.startYear}–${year}`
      : `${site.footer.startYear}`;

  return (
    <footer className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-8">
      <p className="font-mono text-xs tracking-[0.08em] text-quiet">
        {site.identity.shortName} © {yearText}
      </p>
      <p className="max-w-md text-sm leading-6 text-quiet">{site.footer.note}</p>
    </footer>
  );
}
