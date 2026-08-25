// ---------------------------------------------------------------------------
// Role/capability model — PHASE_4_PLAN.md Section 3.
//
// A single capability table rather than scattered `if (role === "manager")`
// checks sprinkled through Server Actions. Every mutating action should
// call the relevant `canX(role)` helper (via requireRole in lib/admin/auth.ts)
// instead of comparing role strings directly, so the rules stay in one
// place as the admin surface grows.
// ---------------------------------------------------------------------------

import type { adminRoleEnum } from "@/db/schema";

export type AdminRole = (typeof adminRoleEnum.enumValues)[number];

export const ADMIN_ROLES: AdminRole[] = ["super_admin", "manager", "editor"];

export function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === "string" && (ADMIN_ROLES as string[]).includes(value);
}

/** Review applications: start review, approve, reject, return to review. */
export function canReviewApplications(role: AdminRole): boolean {
  return role === "super_admin" || role === "manager";
}

/** Publish / unpublish / archive artists. */
export function canPublish(role: AdminRole): boolean {
  return role === "super_admin" || role === "manager";
}

/** Edit artist content (profile, photos, music, shows, etc.) and create artists manually. */
export function canEditArtists(role: AdminRole): boolean {
  return role === "super_admin" || role === "manager" || role === "editor";
}

/** Upload / replace / delete / reorder media. */
export function canManageMedia(role: AdminRole): boolean {
  return role === "super_admin" || role === "manager" || role === "editor";
}

/** Archive an artist (a stronger action than unpublish — hides it from admin lists by default too). */
export function canArchiveArtists(role: AdminRole): boolean {
  return role === "super_admin" || role === "manager";
}

/** Create/deactivate other admin accounts, change roles. */
export function canManageAdmins(role: AdminRole): boolean {
  return role === "super_admin";
}

/** View the activity/audit log. */
export function canViewActivity(role: AdminRole): boolean {
  return role === "super_admin" || role === "manager";
}

export function roleLabel(role: AdminRole): string {
  switch (role) {
    case "super_admin":
      return "Super Admin";
    case "manager":
      return "Manager";
    case "editor":
      return "Editor";
  }
}
