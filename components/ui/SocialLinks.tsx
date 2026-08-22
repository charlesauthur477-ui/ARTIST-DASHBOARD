import { Music2 } from "lucide-react";
import type { SocialLinks as SocialLinksType } from "@/types/artist";
import { cn } from "@/lib/cn";
import { FacebookIcon, InstagramIcon, YoutubeIcon } from "./BrandIcons";

// Minimal inline icons for platforms lucide-react doesn't ship (TikTok, X,
// Apple Music) so we never depend on an external icon CDN.
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16.6 5.82c-1.02-.99-1.6-2.33-1.66-3.72h-3.02v13.9a2.71 2.71 0 1 1-2.7-2.83c.25 0 .49.03.71.09V9.9a5.9 5.9 0 0 0-.71-.04A5.72 5.72 0 1 0 15 15.44V9.02a8.15 8.15 0 0 0 4.6 1.4V7.4c-1.14 0-2.2-.36-3-.98a4.7 4.7 0 0 1 0-.6Z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M18.24 3H21l-6.55 7.49L22.2 21h-6.02l-4.72-6.18L6.02 21H3.24l7.02-8.02L2.4 3h6.17l4.26 5.65L18.24 3Zm-1.05 16.17h1.67L7.9 4.73H6.1l11.09 14.44Z" />
    </svg>
  );
}

function AppleMusicIcon({ className }: { className?: string }) {
  return <Music2 className={className} aria-hidden="true" />;
}

const ICONS: Record<keyof SocialLinksType, React.ComponentType<{ className?: string }>> = {
  instagram: InstagramIcon,
  youtube: YoutubeIcon,
  spotify: Music2,
  appleMusic: AppleMusicIcon,
  tiktok: TikTokIcon,
  facebook: FacebookIcon,
  x: XIcon,
};

const LABELS: Record<keyof SocialLinksType, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  spotify: "Spotify",
  appleMusic: "Apple Music",
  tiktok: "TikTok",
  facebook: "Facebook",
  x: "X (Twitter)",
};

interface SocialLinksProps {
  links: SocialLinksType;
  className?: string;
  iconClassName?: string;
}

export function SocialLinks({ links, className, iconClassName }: SocialLinksProps) {
  const entries = (Object.entries(links) as [keyof SocialLinksType, string | undefined][]).filter(
    ([, url]) => Boolean(url)
  );

  if (entries.length === 0) return null;

  return (
    <ul className={cn("flex items-center gap-3", className)}>
      {entries.map(([platform, url]) => {
        const Icon = ICONS[platform];
        return (
          <li key={platform}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={LABELS[platform]}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border-subtle text-foreground/80 transition hover:border-bronze-400/60 hover:text-bronze-300 focus-visible:border-bronze-400/60"
            >
              <Icon className={cn("h-4 w-4", iconClassName)} />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
