"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { checkLoginRateLimit, resetLoginRateLimit } from "@/lib/admin/rateLimit";
import { logActivity } from "@/lib/admin/activity";

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

  // Rate-limit by IP + email so a single bad actor targeting one account
  // (or spraying many) is throttled without locking out everyone sharing an
  // IP indefinitely. See lib/admin/rateLimit.ts for the documented
  // single-instance limitation.
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "unknown";
  const rateLimitKey = `${ip}:${email}`;

  const rateLimit = checkLoginRateLimit(rateLimitKey);
  if (!rateLimit.allowed) {
    const minutes = Math.ceil((rateLimit.retryAfterMs ?? 0) / 60000);
    return { error: `Too many login attempts. Please try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.` };
  }

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw err;
  }

  resetLoginRateLimit(rateLimitKey);

  const session = await auth();
  if (session?.user) {
    await logActivity({
      actorAdminUserId: session.user.id,
      action: "admin.signed_in",
      entityType: "admin_user",
      entityId: session.user.id,
      summary: `${session.user.name ?? email} signed in.`,
    });
  }

  redirect(callbackUrl.startsWith("/admin") ? callbackUrl : "/admin");
}
