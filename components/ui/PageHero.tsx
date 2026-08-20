import { cn } from "@/lib/cn";

export function PageHero({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <section className={cn("border-b border-border-subtle bg-surface/30", className)}>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <p className="text-xs font-medium tracking-[0.25em] text-bronze-300 uppercase">{eyebrow}</p>
        <h1 className="font-display text-balance mt-3 text-4xl leading-tight sm:text-5xl md:text-6xl">{title}</h1>
        {description ? <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{description}</p> : null}
      </div>
    </section>
  );
}
