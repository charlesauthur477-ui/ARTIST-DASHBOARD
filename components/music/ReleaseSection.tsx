import type { Release } from "@/types/artist";
import { ReleaseGrid } from "./ReleaseGrid";

export function ReleaseSection({ title, releases }: { title: string; releases: Release[] }) {
  if (releases.length === 0) return null;
  return (
    <div className="mb-16 last:mb-0">
      <h3 className="mb-6 text-xs font-medium tracking-[0.25em] text-muted uppercase">{title}</h3>
      <ReleaseGrid releases={releases} />
    </div>
  );
}
