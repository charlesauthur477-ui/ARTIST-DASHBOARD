import { eq } from "drizzle-orm";
import { hash, compare } from "bcryptjs";
import { randomBytes, createHash } from "node:crypto";
import { getDb, schema } from "@/lib/db";

// ---------------------------------------------------------------------------
// artist_users repository — Sprint 5. bcryptjs is the same hashing library
// already used for admin_users (auth.ts), same cost factor convention.
// Passwords/hashes never leave this module and lib/artist/session.ts as
// plaintext or hash — nothing here is ever returned to a client component.
// ---------------------------------------------------------------------------

const BCRYPT_COST = 12;

export async function getArtistUserByArtistId(artistId: string) {
  const db = getDb();
  const [row] = await db.select().from(schema.artistUsers).where(eq(schema.artistUsers.artistId, artistId)).limit(1);
  return row ?? null;
}

export async function getArtistUserByEmail(email: string) {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const [row] = await db.select().from(schema.artistUsers).where(eq(schema.artistUsers.email, normalized)).limit(1);
  return row ?? null;
}

/**
 * Admin-only: creates or updates the portal login for one artist. Exactly
 * one artist_users row per artist (artistId is unique — enforced at the DB
 * level too). A password is required to create a brand-new login; omitting
 * it on an existing login just updates the email/keeps the current
 * password.
 */
export async function upsertArtistPortalAccess(
  artistId: string,
  email: string,
  password?: string
): Promise<{ success: boolean; error?: string }> {
  const db = getDb();
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return { success: false, error: "Email is required." };

  const existingForArtist = await getArtistUserByArtistId(artistId);
  const existingForEmail = await getArtistUserByEmail(normalizedEmail);
  if (existingForEmail && existingForEmail.artistId !== artistId) {
    return { success: false, error: "That email is already used by another artist's login." };
  }

  if (existingForArtist) {
    const values: Partial<typeof schema.artistUsers.$inferInsert> = { email: normalizedEmail, updatedAt: new Date() };
    if (password) values.passwordHash = await hash(password, BCRYPT_COST);
    await db.update(schema.artistUsers).set(values).where(eq(schema.artistUsers.id, existingForArtist.id));
    return { success: true };
  }

  if (!password) return { success: false, error: "A password is required to create a new artist login." };
  await db.insert(schema.artistUsers).values({ artistId, email: normalizedEmail, passwordHash: await hash(password, BCRYPT_COST) });
  return { success: true };
}

export async function setArtistUserActive(artistId: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
  const db = getDb();
  const existing = await getArtistUserByArtistId(artistId);
  if (!existing) return { success: false, error: "No portal login exists for this artist yet." };
  await db.update(schema.artistUsers).set({ isActive, updatedAt: new Date() }).where(eq(schema.artistUsers.id, existing.id));
  return { success: true };
}

/** Returns the matching artist_users row only if the password is correct and the account is active; otherwise null. */
export async function verifyArtistCredentials(email: string, password: string) {
  const row = await getArtistUserByEmail(email);
  if (!row || !row.isActive) return null;
  const ok = await compare(password, row.passwordHash);
  if (!ok) return null;
  return row;
}

// ---------------------------------------------------------------------------
// Self-service "forgot password" — 3-day sprint, item 3. Same anti-
// enumeration + single-use + expiring-token shape as any standard reset
// flow: the raw token is only ever emailed and briefly held in memory here;
// the DB only ever stores a SHA-256 hash of it, so a leaked database row
// can't be used to reset the account (same reasoning as never storing a
// reversible password). One hour expiry, cleared immediately on successful
// use so a token can never be replayed.
// ---------------------------------------------------------------------------

const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashResetToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Always returns a raw token if — and only if — an active artist_users row
 * matches this email. Returns null for "no matching account" or "account
 * deactivated" so the caller can react WITHOUT ever telling the requester
 * which case occurred (that distinction is exactly what an enumeration
 * attack would probe for).
 */
export async function createPasswordResetToken(email: string): Promise<{ artistUserId: string; artistId: string; token: string } | null> {
  const user = await getArtistUserByEmail(email);
  if (!user || !user.isActive) return null;

  const rawToken = randomBytes(RESET_TOKEN_BYTES).toString("hex");
  const db = getDb();
  await db
    .update(schema.artistUsers)
    .set({
      passwordResetTokenHash: hashResetToken(rawToken),
      passwordResetExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      updatedAt: new Date(),
    })
    .where(eq(schema.artistUsers.id, user.id));

  return { artistUserId: user.id, artistId: user.artistId, token: rawToken };
}

/**
 * Verifies a raw token against the stored hash and expiry, then
 * immediately sets a new password and clears the reset token fields
 * (single-use). Deliberately does the "is this token valid" check and the
 * "consume it" step in one place so there's no window where a token could
 * be validated twice, and no other code path can consume a reset token —
 * this is the ONLY way passwordResetTokenHash/passwordResetExpiresAt are
 * ever cleared.
 */
export async function resetPasswordWithToken(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  if (!token) return { success: false, error: "This reset link is invalid." };
  if (newPassword.length < 8) return { success: false, error: "New password must be at least 8 characters." };

  const tokenHash = hashResetToken(token);
  const db = getDb();
  const [row] = await db.select().from(schema.artistUsers).where(eq(schema.artistUsers.passwordResetTokenHash, tokenHash)).limit(1);

  if (!row || !row.isActive) return { success: false, error: "This reset link is invalid or has already been used." };
  if (!row.passwordResetExpiresAt || row.passwordResetExpiresAt.getTime() < Date.now()) {
    return { success: false, error: "This reset link has expired. Please request a new one." };
  }

  await db
    .update(schema.artistUsers)
    .set({
      passwordHash: await hash(newPassword, BCRYPT_COST),
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(schema.artistUsers.id, row.id));

  return { success: true };
}

export async function changeArtistPassword(
  artistUserId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const db = getDb();
  const [row] = await db.select().from(schema.artistUsers).where(eq(schema.artistUsers.id, artistUserId)).limit(1);
  if (!row) return { success: false, error: "Account not found." };

  const ok = await compare(currentPassword, row.passwordHash);
  if (!ok) return { success: false, error: "Current password is incorrect." };
  if (newPassword.length < 8) return { success: false, error: "New password must be at least 8 characters." };

  await db.update(schema.artistUsers).set({ passwordHash: await hash(newPassword, BCRYPT_COST), updatedAt: new Date() }).where(eq(schema.artistUsers.id, artistUserId));
  return { success: true };
}
