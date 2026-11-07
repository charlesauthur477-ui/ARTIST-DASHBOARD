import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdminRole, type AdminRole } from "@/lib/admin/permissions";
import { getAdminSessionToken, verifyAdminSessionToken } from "@/lib/admin/session";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export interface AdminSessionUser {
  id: string;
  role: AdminRole;
  email: string;
  name: string;
}

/**
 * Resolves the currently authenticated admin user.
 * Checks the direct signed admin session token first, falling back to NextAuth auth().
 * Always verifies is_active and role in the database.
 */
export async function getAdminSessionUser(): Promise<AdminSessionUser | null> {
  // 1. Direct admin session token check (bulletproof on Vercel)
  try {
    const directToken = await getAdminSessionToken();
    if (directToken) {
      const payload = await verifyAdminSessionToken(directToken);
      if (payload?.sub) {
        const db = getDb();
        const [adminRow] = await db
          .select()
          .from(schema.adminUsers)
          .where(eq(schema.adminUsers.id, payload.sub))
          .limit(1);

        if (adminRow && adminRow.isActive && isAdminRole(adminRow.role)) {
          const [userRow] = await db
            .select()
            .from(schema.users)
            .where(eq(schema.users.id, payload.sub))
            .limit(1);

          return {
            id: adminRow.id,
            role: adminRow.role,
            email: userRow?.email ?? "",
            name: userRow?.name ?? userRow?.email ?? "Admin",
          };
        }
      }
    }
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest === "DYNAMIC_SERVER_USAGE") throw err;
    console.error("[auth] direct admin session check error:", err);
  }

  // 2. NextAuth session fallback
  try {
    const session = await auth();
    const user = session?.user;
    if (user && user.isActive && isAdminRole(user.role)) {
      return {
        id: user.id,
        role: user.role,
        email: user.email ?? "",
        name: user.name ?? user.email ?? "Admin",
      };
    }
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest === "DYNAMIC_SERVER_USAGE") throw err;
    console.error("[auth] nextauth session check error:", err);
  }

  return null;
}

/**
 * Call at the top of any admin Server Component or Server Action that
 * requires *some* signed-in, active admin (any role). Redirects to
 * /admin/login if not.
 */
export async function requireAdmin(): Promise<AdminSessionUser> {
  const user = await getAdminSessionUser();
  if (!user) {
    redirect("/admin/login");
  }
  return user;
}

/**
 * Call at the top of a Server Action that requires a SPECIFIC set of roles
 */
export async function requireRole(allowed: AdminRole[]): Promise<AdminSessionUser> {
  const user = await requireAdmin();
  if (!allowed.includes(user.role)) {
    throw new Error("You do not have permission to perform this action.");
  }
  return user;
}

