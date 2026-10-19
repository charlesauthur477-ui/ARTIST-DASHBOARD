import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

// ---------------------------------------------------------------------------
// Who gets the "new booking enquiry" admin notification.
//
// Simplest configurable option first: ADMIN_NOTIFICATION_EMAIL (comma-
// separated) lets an operator point notifications at a shared inbox
// without touching the database. If unset, falls back to every active
// admin_users row with booking-management capability (super_admin/manager
// — the same roles canManageBookings() already grants booking access to),
// so notifications work out of the box with zero extra configuration.
// ---------------------------------------------------------------------------

export function getAdminNotificationEmailsFromEnv(): string[] {
  const raw = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function getAdminNotificationRecipients(): Promise<string[]> {
  const fromEnv = getAdminNotificationEmailsFromEnv();
  if (fromEnv.length > 0) return fromEnv;

  const db = getDb();
  const rows = await db
    .select({ email: schema.users.email })
    .from(schema.adminUsers)
    .innerJoin(schema.users, eq(schema.adminUsers.id, schema.users.id))
    .where(and(eq(schema.adminUsers.isActive, true), inArray(schema.adminUsers.role, ["super_admin", "manager"])));

  return rows.map((r) => r.email).filter(Boolean);
}
