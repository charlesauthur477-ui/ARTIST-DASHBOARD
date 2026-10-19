// ---------------------------------------------------------------------------
// Single place to build an absolute site URL for links inside emails
// (password reset links, "review this booking" admin links, etc.), where a
// relative path won't work because the link is read outside the browser
// session that generated it.
//
// Reads NEXT_PUBLIC_SITE_URL (documented in .env.example) first, then falls
// back to VERCEL_URL (auto-populated by Vercel on every deployment), then
// finally to the same demo domain the rest of the app already hardcodes
// (app/sitemap.ts, app/robots.ts) so behavior is unchanged when neither env
// var is set.
// ---------------------------------------------------------------------------

export function siteUrl(path = ""): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "https://wavelength-artists-demo.vercel.app";

  const trimmedBase = base.replace(/\/+$/, "");
  const trimmedPath = path.startsWith("/") ? path : `/${path}`;
  return `${trimmedBase}${trimmedPath}`;
}
