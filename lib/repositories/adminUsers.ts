import { and, eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { getDb, schema } from "@/lib/db";
import type { AdminRole } from "@/lib/admin/permissions";

// ---------------------------------------------------------------------------
// admin_users repository — 3-day sprint, item 4 (in-app admin user
// management). Reuses the EXACT same tables and hashing convention as
// scripts/create_admin_user.ts (the previous, CLI-only way to create an
// admin): one row in `user` (Auth.js's own adapter table — id/name/email)
// plus one row in `admin_users` (passwordHash/role/isActive) sharing that
// same id. No second authentication system, no new tables.
// ---------------------------------------------------------------------------

const BCRYPT_COST = 12;

export interface AdminUserRow {
  id: string;
  name: string | null;
  email: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: schema.adminUsers.id,
      name: schema.users.name,
      email: schema.users.email,
      role: schema.adminUsers.role,
      isActive: schema.adminUsers.isActive,
      createdAt: schema.adminUsers.createdAt,
      updatedAt: schema.adminUsers.updatedAt,
    })
    .from(schema.adminUsers)
    .innerJoin(schema.users, eq(schema.adminUsers.id, schema.users.id))
    .orderBy(schema.adminUsers.createdAt);
  return rows;
}

export async function getAdminUserById(id: string): Promise<AdminUserRow | null> {
  const db = getDb();
  const [row] = await db
    .select({
      id: schema.adminUsers.id,
      name: schema.users.name,
      email: schema.users.email,
      role: schema.adminUsers.role,
      isActive: schema.adminUsers.isActive,
      createdAt: schema.adminUsers.createdAt,
      updatedAt: schema.adminUsers.updatedAt,
    })
    .from(schema.adminUsers)
    .innerJoin(schema.users, eq(schema.adminUsers.id, schema.users.id))
    .where(eq(schema.adminUsers.id, id))
    .limit(1);
  return row ?? null;
}

/** Active admin_users rows, regardless of role — used for the "don't deactivate the last usable admin" guard. */
export async function countActiveAdmins(): Promise<number> {
  const db = getDb();
  const rows = await db.select({ id: schema.adminUsers.id }).from(schema.adminUsers).where(eq(schema.adminUsers.isActive, true));
  return rows.length;
}

/** Active super_admin rows — used for the "don't demote/deactivate the last super_admin" guard. */
export async function countActiveSuperAdmins(): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ id: schema.adminUsers.id })
    .from(schema.adminUsers)
    .where(and(eq(schema.adminUsers.role, "super_admin"), eq(schema.adminUsers.isActive, true)));
  return rows.length;
}

export async function createAdminUser(input: {
  email: string;
  name: string;
  role: AdminRole;
  password: string;
}): Promise<{ success: boolean; error?: string; id?: string }> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim() || email;
  if (!email || !email.includes("@")) return { success: false, error: "Please enter a valid email address." };
  if (input.password.length < 12) return { success: false, error: "Password must be at least 12 characters." };

  const db = getDb();
  const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (existing) return { success: false, error: "A user with that email already exists." };

  const passwordHash = await hash(input.password, BCRYPT_COST);
  const [userRow] = await db.insert(schema.users).values({ email, name }).returning();
  await db.insert(schema.adminUsers).values({ id: userRow.id, passwordHash, role: input.role, isActive: true });

  return { success: true, id: userRow.id };
}

export async function setAdminUserRole(id: string, role: AdminRole): Promise<void> {
  const db = getDb();
  await db.update(schema.adminUsers).set({ role, updatedAt: new Date() }).where(eq(schema.adminUsers.id, id));
}

export async function setAdminUserActive(id: string, isActive: boolean): Promise<void> {
  const db = getDb();
  await db.update(schema.adminUsers).set({ isActive, updatedAt: new Date() }).where(eq(schema.adminUsers.id, id));
}

export async function setAdminUserPassword(id: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  if (newPassword.length < 12) return { success: false, error: "Password must be at least 12 characters." };
  const db = getDb();
  await db.update(schema.adminUsers).set({ passwordHash: await hash(newPassword, BCRYPT_COST), updatedAt: new Date() }).where(eq(schema.adminUsers.id, id));
  return { success: true };
}
