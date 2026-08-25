import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdminRole, type AdminRole } from "@/lib/admin/permissions";

// ---------------------------------------------------------------------------
// requireAdmin() / requireRole() — the independent, server-side
// authorization check every protected admin page and every mutating Server
// Action must call for itself. Middleware (middleware.ts) is only the first,
// cheap gate; these are the real check, per PHASE_4_PLAN.md Section 12's
// "no client-side authorization as the only protection" / "middleware must
// not be the only layer" requirements.
//
// Both re-read the session on every call (auth() -> the database session
// adapter -> a fresh admin_users row via the `session` callback in auth.ts),
// so a deactivated account or changed role takes effect immediately, not on
// next login.
// ---------------------------------------------------------------------------

export interface AdminSessionUser {
  id: string;
  role: AdminRole;
  email: string;
  name: string;
}

/**
 * Call at the top of any admin Server Component or Server Action that
 * requires *some* signed-in, active admin (any role). Redirects to
 * /admin/login if not.
 */
export async function requireAdmin(): Promise<AdminSessionUser> {
  const session = await auth();
  const user = session?.user;

  if (!user || !user.isActive || !isAdminRole(user.role)) {
    redirect("/admin/login");
  }

  return {
    id: user.id,
    role: user.role,
    email: user.email ?? "",
    name: user.name ?? user.email ?? "",
  };
}

/**
 * Call at the top of a Server Action that requires a SPECIFIC set of roles
 * (see lib/admin/permissions.ts for the capability table this is normally
 * driven from, e.g. requireRole -> canPublish(role) checks upstream of
 * this). Throws rather than redirecting, since this runs inside mutations
 * where a thrown error surfaces as an action result, not a lost page.
 */
export async function requireRole(allowed: AdminRole[]): Promise<AdminSessionUser> {
  const user = await requireAdmin();
  if (!allowed.includes(user.role)) {
    throw new Error("You do not have permission to perform this action.");
  }
  return user;
}

/**
 * Non-throwing variant for places that want to branch on "is there an admin
 * session" without redirecting (e.g. the login page itself, deciding
 * whether to bounce an already-signed-in admin to /admin).
 */
export async function getAdminSessionUser(): Promise<AdminSessionUser | null> {
  const session = await auth();
  const user = session?.user;
  if (!user || !user.isActive || !isAdminRole(user.role)) return null;
  return { id: user.id, role: user.role, email: user.email ?? "", name: user.name ?? user.email ?? "" };
}
