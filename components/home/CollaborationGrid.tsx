import type { Collaboration } from "@/types/artist";

export function CollaborationGrid({ collaborations }: { collaborations: Collaboration[] }) {
  if (collaborations.length === 0) return null;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {collaborations.map((c) => (
        <div key={c.id} className="rounded-lg border border-border-subtle p-5">
          <p className="font-display text-lg text-foreground">{c.name}</p>
          <p className="mt-1 text-xs font-medium tracking-[0.15em] text-bronze-300 uppercase">{c.type}</p>
          {c.description ? <p className="mt-2 text-sm leading-relaxed text-muted">{c.description}</p> : null}
        </div>
      ))}
    </div>
  );
}
