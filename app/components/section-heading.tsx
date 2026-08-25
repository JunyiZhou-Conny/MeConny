type SectionHeadingProps = {
  number: string;
  kicker: string;
  title: string;
  body: string;
};

export function SectionHeading({
  number,
  kicker,
  title,
  body,
}: SectionHeadingProps) {
  return (
    <div className="grid gap-6 md:grid-cols-[auto_1fr] md:gap-12">
      <p className="font-mono text-xs tracking-[0.22em] text-tide uppercase">
        {number}
      </p>
      <div className="max-w-2xl">
        <p className="font-mono text-xs tracking-[0.18em] text-quiet uppercase">
          {kicker}
        </p>
        <h2 className="mt-3 font-display text-3xl leading-tight font-medium tracking-tight text-ink sm:text-4xl">
          {title}
        </h2>
        <p className="mt-4 text-base leading-7 text-quiet">{body}</p>
      </div>
    </div>
  );
}
