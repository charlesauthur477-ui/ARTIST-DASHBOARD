import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { encode, decode, type JWT } from "next-auth/jwt";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

// ---------------------------------------------------------------------------
// Artist Portal session handling — RAPID BUILD MODE Sprint 5.
//
// Deliberately NOT part of the admin NextAuth() instance in auth.ts — that
// file, its Credentials provider, and its DrizzleAdapter tables
// (user/account/session) are untouched by anything in this module. Instead
// this issues its own signed cookie using next-auth/jwt's encode()/decode()
// directly (the same primitive Auth.js itself uses for JWT sessions), keyed
// by a distinct cookie name used as the HKDF `salt`, so an artist session
// token and an admin session token are cryptographically unrelated even
// though they may share the same AUTH_SECRET. This keeps the two auth
// systems fully independent: nothing here can read, forge, or invalidate an
// admin session, and nothing in auth.ts/proxy.ts's admin branch was
// modified to build this.
//
// Same defense-in-depth shape as lib/admin/auth.ts: proxy.ts does a cheap
// cookie-presence/signature check only; requireArtistSession() here
// re-reads artist_users.is_active from the database on every call, so a
// deactivated artist account loses access immediately, not just at next
// login.
// ---------------------------------------------------------------------------

export const ARTIST_COOKIE_NAME = "artist-session-token";
const ARTIST_SESSION_MAX_AGE = 12 * 60 * 60; // 12h — matches the admin session lifetime.

function getSecret(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "wavelength-artist-platform-secure-jwt-secret-key-production-2026"
  );
}

export async function createArtistSession(artistUserId: string): Promise<void> {
  const token = await encode({
    secret: getSecret(),
    salt: ARTIST_COOKIE_NAME,
    maxAge: ARTIST_SESSION_MAX_AGE,
    token: { sub: artistUserId },
  });

  const store = await cookies();
  store.set(ARTIST_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ARTIST_SESSION_MAX_AGE,
  });
}

export async function clearArtistSession(): Promise<void> {
  const store = await cookies();
  store.delete(ARTIST_COOKIE_NAME);
}

export interface ArtistSessionUser {
  artistUserId: string;
  artistId: string;
  email: string;
}

/**
 * Non-throwing session read: decodes the cookie, then re-fetches the
 * artist_users row so a deactivated account or a row deleted after the
 * cookie was issued is rejected immediately. Returns null rather than
 * redirecting/throwing — callers that need one of those wrap this.
 */
export async function getArtistSessionUser(): Promise<ArtistSessionUser | null> {
  const store = await cookies();
  const raw = store.get(ARTIST_COOKIE_NAME)?.value;
  if (!raw) return null;

  let payload: JWT | null = null;
  try {
    payload = await decode<JWT>({ token: raw, secret: getSecret(), salt: ARTIST_COOKIE_NAME });
  } catch {
    return null;
  }
  const artistUserId = payload?.sub;
  if (!artistUserId) return null;

  const db = getDb();
  const [row] = await db.select().from(schema.artistUsers).where(eq(schema.artistUsers.id, artistUserId)).limit(1);
  if (!row || !row.isActive) return null;

  return { artistUserId: row.id, artistId: row.artistId, email: row.email };
}

/** Call at the top of any artist Server Component. Redirects to /artist/login if not signed in. */
export async function requireArtistSession(): Promise<ArtistSessionUser> {
  const user = await getArtistSessionUser();
  if (!user) redirect("/artist/login");
  return user;
}

/** Call at the top of any artist Server Action. Throws (surfaces as an action error) rather than redirecting. */
export async function requireArtistSessionForAction(): Promise<ArtistSessionUser> {
  const user = await getArtistSessionUser();
  if (!user) throw new Error("Your session has expired. Please sign in again.");
  return user;
}
