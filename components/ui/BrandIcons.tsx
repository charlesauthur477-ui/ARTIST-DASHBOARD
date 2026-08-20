// Minimal inline brand icons. lucide-react's newer major versions no longer
// ship trademarked platform logos, so the handful of social/streaming
// glyphs used across the site are defined here as small inline SVGs —
// keeps the app free of any external icon CDN dependency.

type IconProps = { className?: string };

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function YoutubeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M21.6 7.2a2.9 2.9 0 0 0-2-2C17.9 4.7 12 4.7 12 4.7s-5.9 0-7.6.5a2.9 2.9 0 0 0-2 2A30.6 30.6 0 0 0 2 12a30.6 30.6 0 0 0 .4 4.8 2.9 2.9 0 0 0 2 2c1.7.5 7.6.5 7.6.5s5.9 0 7.6-.5a2.9 2.9 0 0 0 2-2A30.6 30.6 0 0 0 22 12a30.6 30.6 0 0 0-.4-4.8ZM10 15.3V8.7L15.8 12Z" />
    </svg>
  );
}

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-7.6h2.6l.4-3h-3v-1.9c0-.87.24-1.46 1.5-1.46H16.6V4.34C16.3 4.3 15.3 4.2 14.2 4.2c-2.3 0-3.9 1.4-3.9 4v2.2H7.7v3h2.6V21Z" />
    </svg>
  );
}
