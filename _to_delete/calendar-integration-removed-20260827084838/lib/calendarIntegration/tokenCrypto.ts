import "server-only";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

// ---------------------------------------------------------------------------
// Symmetric encryption for Google OAuth tokens at rest — Calendar
// Integration Phase 1.
//
// Deliberately does NOT introduce a new required env var: the encryption
// key is derived from AUTH_SECRET (already required for both admin and
// artist sessions) via scrypt with a fixed, purpose-specific salt, so the
// same secret can't be reused to derive any other key in this codebase and
// a leaked derived key doesn't help reconstruct AUTH_SECRET itself.
//
// AES-256-GCM: authenticated encryption, so a tampered ciphertext fails to
// decrypt rather than silently returning garbage. Output is a single
// string ("iv:authTag:ciphertext", each hex-encoded) so it fits in one
// `text` column.
//
// Server-only: this module must never be imported by a "use client" file,
// and no Server Action/page should ever return its output to the browser.
// ---------------------------------------------------------------------------

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set — required to encrypt/decrypt stored calendar tokens.");
  }
  cachedKey = scryptSync(secret, "wavelength-calendar-token-v1", 32);
  return cachedKey;
}

export function encryptToken(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${ciphertext.toString("hex")}`;
}

export function decryptToken(stored: string): string {
  const [ivHex, authTagHex, ciphertextHex] = stored.split(":");
  if (!ivHex || !authTagHex || !ciphertextHex) {
    throw new Error("Malformed stored calendar token.");
  }
  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(ciphertextHex, "hex")), decipher.final()]);
  return plaintext.toString("utf8");
}
