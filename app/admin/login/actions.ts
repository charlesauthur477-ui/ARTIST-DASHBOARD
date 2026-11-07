"use server";

import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { checkLoginRateLimit, resetLoginRateLimit } from "@/lib/admin/rateLimit";
import { logActivity } from "@/lib/admin/activity";
import { createAdminSession, clearAdminSession } from "@/lib/admin/session";
import { isAdminRole } from "@/lib/admin/permissions";
import { getDb, schema } from "@/lib/db";

export interface LoginActionState {
  error: string | null;
}

export async function loginAction(_prevState: LoginActionState, formData: FormData): Promise<LoginActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/admin");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "unknown";
  const rateLimitKey = `${ip}:${email}`;

  const rateLimit = checkLoginRateLimit(rateLimitKey);
  if (!rateLimit.allowed) {
    const minutes = Math.ceil((rateLimit.retryAfterMs ?? 0) / 60000);
    return { error: `Too many login attempts. Please try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.` };
  }

  const db = getDb();
  const [userRow] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (!userRow) {
    return { error: "Invalid email or password." };
  }

  const [adminRow] = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.id, userRow.id)).limit(1);
  if (!adminRow || !adminRow.isActive || !isAdminRole(adminRow.role)) {
    return { error: "Invalid email or password." };
  }

  const passwordMatches = await compare(password, adminRow.passwordHash);
  if (!passwordMatches) {
    return { error: "Invalid email or password." };
  }

  resetLoginRateLimit(rateLimitKey);

  // Set direct admin session cookie (bulletproof across Vercel serverless redirects)
  await createAdminSession(adminRow.id);

  // Synchronize with NextAuth if available
  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch {
    // NextAuth internal action quirks ignored since direct session is established
  }

  await logActivity({
    actorAdminUserId: adminRow.id,
    action: "admin.signed_in",
    entityType: "admin_user",
    entityId: adminRow.id,
    summary: `${userRow.name ?? email} signed in.`,
  });

  redirect(callbackUrl.startsWith("/admin") ? callbackUrl : "/admin");
}

export async function adminLogoutAction(): Promise<void> {
  await clearAdminSession();
  try {
    await signOut({ redirect: false });
  } catch {
    // Ignore
  }
  redirect("/admin/login");
}

