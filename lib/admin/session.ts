import "server-only";
import { cookies } from "next/headers";
import { encode, decode } from "next-auth/jwt";

export const ADMIN_COOKIE_NAME = "admin-session-token";
export const ADMIN_SECURE_COOKIE_NAME = "__Secure-admin-session-token";
const ADMIN_SESSION_MAX_AGE = 12 * 60 * 60; // 12 hours

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set.");
  }
  return secret;
}

export async function createAdminSession(adminUserId: string): Promise<void> {
  const secret = getSecret();
  const token = await encode({
    secret,
    salt: ADMIN_COOKIE_NAME,
    maxAge: ADMIN_SESSION_MAX_AGE,
    token: { sub: adminUserId },
  });

  const isProduction = process.env.NODE_ENV === "production";
  const store = await cookies();

  // Set standard admin session cookie
  store.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });

  // If in production, also set __Secure- prefixed cookie for Vercel HTTPS
  if (isProduction) {
    store.set(ADMIN_SECURE_COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE,
    });
  }
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE_NAME);
  store.delete(ADMIN_SECURE_COOKIE_NAME);
}

export async function getAdminSessionToken(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(ADMIN_SECURE_COOKIE_NAME)?.value ?? store.get(ADMIN_COOKIE_NAME)?.value;
  return token ?? null;
}

export async function verifyAdminSessionToken(token: string): Promise<{ sub: string } | null> {
  try {
    const secret = getSecret();
    const payload = await decode({
      token,
      secret,
      salt: ADMIN_COOKIE_NAME,
    });
    if (payload?.sub && typeof payload.sub === "string") {
      return { sub: payload.sub };
    }
    return null;
  } catch {
    return null;
  }
}
