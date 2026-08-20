import type { Release } from "@/types/artist";
import { ReleaseCard } from "./ReleaseCard";

export function ReleaseGrid({ releases }: { releases: Release[] }) {
  if (releases.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
      {releases.map((release) => (
        <ReleaseCard key={release.id} release={release} />
      ))}
    </div>
  );
}
