import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface CTASectionProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function CTASection({ eyebrow, title, description, children, className }: CTASectionProps) {
  return (
    <section className={cn("relative overflow-hidden bg-surface", className)}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(185,141,79,0.14),_transparent_60%)]"
      />
      <div className="relative mx-auto max-w-3xl px-6 py-20 text-center sm:py-28">
        {eyebrow ? (
          <p className="mb-3 text-xs font-medium tracking-[0.25em] text-bronze-300 uppercase">{eyebrow}</p>
        ) : null}
        <h2 className="font-display text-balance text-3xl leading-tight sm:text-4xl md:text-5xl">{title}</h2>
        {description ? <p className="mx-auto mt-5 max-w-xl text-base text-muted sm:text-lg">{description}</p> : null}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">{children}</div>
      </div>
    </section>
  );
}
