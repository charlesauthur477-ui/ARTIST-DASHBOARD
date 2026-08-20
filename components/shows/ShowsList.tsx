import type { Show } from "@/types/artist";
import { ShowCard } from "./ShowCard";

export function ShowsList({ shows, emptyLabel }: { shows: Show[]; emptyLabel: string }) {
  if (shows.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border-subtle px-6 py-12 text-center text-sm text-muted">
        {emptyLabel}
      </p>
    );
  }
  return (
    <div>
      {shows.map((show) => (
        <ShowCard key={show.id} show={show} />
      ))}
    </div>
  );
}
