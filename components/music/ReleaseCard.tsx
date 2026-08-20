import Image from "next/image";
import type { Release } from "@/types/artist";
import { formatReleaseDate } from "@/lib/format";
import { StreamingLinks } from "./StreamingLinks";

const TYPE_LABEL: Record<Release["type"], string> = {
  album: "Album",
  ep: "EP",
  single: "Single",
};

export function ReleaseCard({ release, priority = false }: { release: Release; priority?: boolean }) {
  return (
    <article className="group flex flex-col">
      <div className="relative aspect-square overflow-hidden rounded-md bg-surface">
        <Image
          src={release.coverImage}
          alt={`${release.title} cover artwork`}
          fill
          sizes="(min-width: 1024px) 22vw, (min-width: 640px) 40vw, 90vw"
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          priority={priority}
        />
      </div>
      <div className="mt-4">
        <p className="text-xs font-medium tracking-[0.2em] text-bronze-300 uppercase">
          {TYPE_LABEL[release.type]} · {formatReleaseDate(release.releaseDate)}
        </p>
        <h3 className="mt-1.5 font-display text-xl text-foreground">{release.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted line-clamp-3">{release.description}</p>
        <StreamingLinks links={release.streamingLinks} className="mt-4" />
      </div>
    </article>
  );
}
