"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/admin/auth";
import { canManageAdmins, isAdminRole, type AdminRole } from "@/lib/admin/permissions";
import { logActivity } from "@/lib/admin/activity";
import {
  getAdminUserById,
  createAdminUser,
  setAdminUserRole,
  setAdminUserActive,
  setAdminUserPassword,
  countActiveAdmins,
  countActiveSuperAdmins,
} from "@/lib/repositories/adminUsers";

// ---------------------------------------------------------------------------
// Admin user management — 3-day sprint, item 4. Every action here requires
// super_admin (canManageAdmins) — this is the in-app replacement for what
// scripts/create_admin_user.ts used to be the ONLY way to do. Reuses the
// exact same admin_users/user tables and bcrypt convention as that script
// and as auth.ts's Credentials provider — no second auth system.
//
// Two standing safety rules enforced here, not just in the UI (an admin
// hitting these Server Actions directly must be stopped too):
//   1. The last ACTIVE admin account (any role) can never be deactivated —
//      doing so would lock everyone out of /admin permanently, with no CLI
//      fallback for re-enabling it short of direct DB access.
//   2. The last ACTIVE super_admin can never be deactivated or demoted to
//      manager/editor — doing so would leave canManageAdmins() with no one
//      left who can create/reactivate/promote another admin, a softer but
//      just-as-real lockout of this exact feature.
//   3. An admin cannot deactivate their own account from this screen — a
//      narrower, simpler guard than #1/#2 that prevents an accidental
//      self-lockout even when other admins remain.
// ---------------------------------------------------------------------------

export interface AdminUserActionState {
  error: string | null;
  success?: boolean;
}

export async function createAdminUserAction(
  _prevState: AdminUserActionState,
  formData: FormData
): Promise<AdminUserActionState> {
  const actor = await requireRole(["super_admin"]);
  if (!canManageAdmins(actor.role)) return { error: "You do not have permission to manage admin accounts." };

  const email = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!isAdminRole(role)) return { error: "Please choose a valid role." };

  const result = await createAdminUser({ email, name, role, password });
  if (!result.success) return { error: result.error ?? "Could not create admin account." };

  await logActivity({
    actorAdminUserId: actor.id,
    action: "admin.created",
    entityType: "admin_user",
    entityId: result.id ?? null,
    summary: `${actor.name} created a new admin account (${email}, role: ${role}).`,
    metadata: { email, role },
  });

  revalidatePath("/admin/admins");
  return { error: null, success: true };
}

export async function setAdminUserRoleAction(adminUserId: string, role: AdminRole): Promise<AdminUserActionState> {
  const actor = await requireRole(["super_admin"]);
  if (!canManageAdmins(actor.role)) return { error: "You do not have permission to manage admin accounts." };
  if (!isAdminRole(role)) return { error: "Invalid role." };

  const target = await getAdminUserById(adminUserId);
  if (!target) return { error: "Admin account not found." };

  if (target.role === "super_admin" && role !== "super_admin" && target.isActive) {
    const superAdminCount = await countActiveSuperAdmins();
    if (superAdminCount <= 1) {
      return { error: "Cannot change the role of the last active Super Admin — promote another admin first." };
    }
  }

  await setAdminUserRole(adminUserId, role);

  await logActivity({
    actorAdminUserId: actor.id,
    action: "admin.role_changed",
    entityType: "admin_user",
    entityId: adminUserId,
    summary: `${actor.name} changed ${target.email}'s role from ${target.role} to ${role}.`,
    metadata: { previousRole: target.role, newRole: role },
  });

  revalidatePath("/admin/admins");
  return { error: null, success: true };
}

export async function setAdminUserActiveAction(adminUserId: string, isActive: boolean): Promise<AdminUserActionState> {
  const actor = await requireRole(["super_admin"]);
  if (!canManageAdmins(actor.role)) return { error: "You do not have permission to manage admin accounts." };

  const target = await getAdminUserById(adminUserId);
  if (!target) return { error: "Admin account not found." };

  if (!isActive) {
    if (target.id === actor.id) {
      return { error: "You cannot deactivate your own account." };
    }
    const activeCount = await countActiveAdmins();
    if (target.isActive && activeCount <= 1) {
      return { error: "Cannot deactivate the last active admin account." };
    }
    if (target.role === "super_admin" && target.isActive) {
      const superAdminCount = await countActiveSuperAdmins();
      if (superAdminCount <= 1) {
        return { error: "Cannot deactivate the last active Super Admin — promote another admin first." };
      }
    }
  }

  await setAdminUserActive(adminUserId, isActive);

  await logActivity({
    actorAdminUserId: actor.id,
    action: isActive ? "admin.activated" : "admin.deactivated",
    entityType: "admin_user",
    entityId: adminUserId,
    summary: `${actor.name} ${isActive ? "reactivated" : "deactivated"} ${target.email}'s admin account.`,
  });

  revalidatePath("/admin/admins");
  return { error: null, success: true };
}

export async function setAdminUserPasswordAction(
  _prevState: AdminUserActionState,
  formData: FormData
): Promise<AdminUserActionState> {
  const actor = await requireRole(["super_admin"]);
  if (!canManageAdmins(actor.role)) return { error: "You do not have permission to manage admin accounts." };

  const adminUserId = String(formData.get("adminUserId") ?? "");
  const newPassword = String(formData.get("password") ?? "");

  const target = await getAdminUserById(adminUserId);
  if (!target) return { error: "Admin account not found." };

  const result = await setAdminUserPassword(adminUserId, newPassword);
  if (!result.success) return { error: result.error ?? "Could not set password." };

  await logActivity({
    actorAdminUserId: actor.id,
    action: "admin.password_reset",
    entityType: "admin_user",
    entityId: adminUserId,
    summary: `${actor.name} reset the password for ${target.email}.`,
  });

  revalidatePath("/admin/admins");
  return { error: null, success: true };
}
