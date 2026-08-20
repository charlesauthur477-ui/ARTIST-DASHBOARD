import type { PerformanceFormat } from "@/types/artist";

export function PerformanceFormatCard({ format }: { format: PerformanceFormat }) {
  return (
    <article className="rounded-lg border border-border-subtle p-6 sm:p-7">
      <h3 className="font-display text-xl text-foreground sm:text-2xl">{format.name}</h3>
      <p className="mt-2 text-sm font-medium text-bronze-300">{format.lineup}</p>
      <p className="mt-3 text-sm leading-relaxed text-muted">{format.style}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {format.suitableFor.map((s) => (
          <span
            key={s}
            className="rounded-full border border-border-subtle px-3 py-1 text-xs text-foreground/75"
          >
            {s}
          </span>
        ))}
      </div>
    </article>
  );
}
