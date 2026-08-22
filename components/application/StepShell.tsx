import type { ReactNode } from "react";

export function StepShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl text-foreground sm:text-3xl">{title}</h2>
      {description ? <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted sm:text-base">{description}</p> : null}
      <div className="mt-8 space-y-6">{children}</div>
    </div>
  );
}

export function StepSubsection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-t border-border-subtle pt-6 first:border-none first:pt-0">
      <h3 className="mb-4 text-xs font-medium tracking-[0.2em] text-bronze-300 uppercase">{title}</h3>
      <div className="space-y-5">{children}</div>
    </div>
  );
}
