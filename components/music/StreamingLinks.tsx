import { Music2 } from "lucide-react";
import type { StreamingLinks as StreamingLinksType } from "@/types/artist";
import { cn } from "@/lib/cn";
import { YoutubeIcon } from "@/components/ui/BrandIcons";

const PLATFORM_META: { key: keyof StreamingLinksType; label: string }[] = [
  { key: "spotify", label: "Spotify" },
  { key: "appleMusic", label: "Apple Music" },
  { key: "youtube", label: "YouTube" },
  { key: "soundcloud", label: "SoundCloud" },
];

export function StreamingLinks({ links, className }: { links: StreamingLinksType; className?: string }) {
  const pills = PLATFORM_META.filter((p) => links[p.key]);
  if (pills.length === 0 && !links.other?.length) return null;

  return (
    <div className={cn("flex flex-wrap gap-2.5", className)}>
      {pills.map(({ key, label }) => (
        <a
          key={key}
          href={links[key] as string}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border-subtle px-4 text-xs font-medium tracking-wide text-foreground/85 transition hover:border-bronze-400/60 hover:text-bronze-300"
        >
          {key === "youtube" ? <YoutubeIcon className="h-3.5 w-3.5" /> : <Music2 className="h-3.5 w-3.5" />}
          {label}
        </a>
      ))}
      {links.other?.map((o) => (
        <a
          key={o.url}
          href={o.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border-subtle px-4 text-xs font-medium tracking-wide text-foreground/85 transition hover:border-bronze-400/60 hover:text-bronze-300"
        >
          <Music2 className="h-3.5 w-3.5" />
          {o.label}
        </a>
      ))}
    </div>
  );
}
