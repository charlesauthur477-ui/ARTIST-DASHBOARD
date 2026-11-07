"use server";

import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { logActivity } from "@/lib/admin/activity";

export interface AdminResetState {
  error: string | null;
  success?: boolean;
}

export async function adminResetPasswordAction(
  _prevState: AdminResetState,
  formData: FormData
): Promise<AdminResetState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!email) {
    return { error: "Admin email is required." };
  }

  if (!newPassword || newPassword.length < 12) {
    return { error: "Password must be at least 12 characters long." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const db = getDb();
  const [userRow] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  if (!userRow) {
    return { error: "No admin account found with that email." };
  }

  const [adminRow] = await db
    .select()
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.id, userRow.id))
    .limit(1);

  if (!adminRow || !adminRow.isActive) {
    return { error: "No active admin account found with that email." };
  }

  const passwordHash = await hash(newPassword, 12);

  await db
    .update(schema.adminUsers)
    .set({
      passwordHash,
      updatedAt: new Date(),
    })
    .where(eq(schema.adminUsers.id, adminRow.id));

  await logActivity({
    actorAdminUserId: adminRow.id,
    action: "admin.password_reset",
    entityType: "admin_user",
    entityId: adminRow.id,
    summary: `${userRow.name ?? email} reset their admin password.`,
  });

  return { error: null, success: true };
}
