import "server-only";
import { headers } from "next/headers";

// ---------------------------------------------------------------------------
// Resolves an absolute origin for building the Google OAuth redirect URI
// and the outbound ICS feed URL shown in the Artist Portal. Prefers the
// explicit NEXT_PUBLIC_SITE_URL (already documented, optional, in
// .env.example) so production always gets a stable, deliberately-chosen
// value; falls back to the incoming request's own host so local dev and
// preview deployments work with zero extra config.
// ---------------------------------------------------------------------------
export async function getSiteOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  if (!host) throw new Error("Could not determine site origin — set NEXT_PUBLIC_SITE_URL.");
  return `${proto}://${host}`;
}
