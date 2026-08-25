"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/admin/auth";
import { canReviewApplications } from "@/lib/admin/permissions";
import { logActivity } from "@/lib/admin/activity";
import { approveApplication, markUnderReview, rejectApplication, returnApplicationToReview } from "@/lib/repositories/approvals";
import { getApplicationById } from "@/lib/repositories/applications";
import { slugify } from "@/lib/slug";

// ---------------------------------------------------------------------------
// Application review Server Actions — PHASE_4_PLAN.md Section 5.
//
// Every action here does the real work by calling straight into the
// existing Phase 3 approval service (lib/repositories/approvals.ts) — none
// of the approve/reject/under-review transaction logic is reimplemented
// here. This module's own job is: authorize (requireRole), call the
// reused service, log activity, and revalidate the admin pages that show
// the result.
// ---------------------------------------------------------------------------

const REVIEWER_ROLES = ["super_admin", "manager"] as const;

export interface ApplicationActionState {
  error: string | null;
}

function revalidateApplicationPages(applicationId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/applications");
  revalidatePath(`/admin/applications/${applicationId}`);
}

export async function startReviewAction(_prevState: ApplicationActionState, formData: FormData): Promise<ApplicationActionState> {
  const user = await requireRole([...REVIEWER_ROLES]);
  if (!canReviewApplications(user.role)) return { error: "You do not have permission to review applications." };

  const applicationId = String(formData.get("applicationId") ?? "");
  if (!applicationId) return { error: "Missing application id." };

  const record = await getApplicationById(applicationId);
  if (!record) return { error: "Application not found." };

  await markUnderReview(applicationId, user.id);
  await logActivity({
    actorAdminUserId: user.id,
    action: "application.reviewed",
    entityType: "application",
    entityId: applicationId,
    summary: `${user.name} started reviewing "${record.application.stageName || "an application"}".`,
  });

  revalidateApplicationPages(applicationId);
  return { error: null };
}

export async function approveApplicationAction(_prevState: ApplicationActionState, formData: FormData): Promise<ApplicationActionState> {
  const user = await requireRole([...REVIEWER_ROLES]);
  if (!canReviewApplications(user.role)) return { error: "You do not have permission to approve applications." };

  const applicationId = String(formData.get("applicationId") ?? "");
  const rawSlug = String(formData.get("slug") ?? "");
  if (!applicationId || !rawSlug) return { error: "Missing application id or slug." };

  const slug = slugify(rawSlug);
  const record = await getApplicationById(applicationId);
  if (!record) return { error: "Application not found." };

  const result = await approveApplication(applicationId, slug, user.id);
  if (!result.success) return { error: result.error ?? "Approval failed." };

  await logActivity({
    actorAdminUserId: user.id,
    action: "application.approved",
    entityType: "application",
    entityId: applicationId,
    summary: `${user.name} approved "${record.application.stageName}" as artist "${slug}".`,
    metadata: { artistId: result.artistId, slug },
  });

  revalidateApplicationPages(applicationId);
  revalidatePath("/admin/artists");
  return { error: null };
}

export async function rejectApplicationAction(formData: FormData): Promise<void> {
  const user = await requireRole([...REVIEWER_ROLES]);
  if (!canReviewApplications(user.role)) throw new Error("You do not have permission to reject applications.");

  const applicationId = String(formData.get("applicationId") ?? "");
  const reason = String(formData.get("reason") ?? "");
  if (!applicationId) throw new Error("Missing application id.");

  const record = await getApplicationById(applicationId);
  if (!record) throw new Error("Application not found.");

  await rejectApplication(applicationId, reason, user.id);
  await logActivity({
    actorAdminUserId: user.id,
    action: "application.rejected",
    entityType: "application",
    entityId: applicationId,
    summary: `${user.name} rejected "${record.application.stageName || "an application"}".`,
    metadata: { reason },
  });

  revalidateApplicationPages(applicationId);
}

export async function returnToReviewAction(formData: FormData): Promise<void> {
  const user = await requireRole([...REVIEWER_ROLES]);
  if (!canReviewApplications(user.role)) throw new Error("You do not have permission to do this.");

  const applicationId = String(formData.get("applicationId") ?? "");
  if (!applicationId) throw new Error("Missing application id.");

  const record = await getApplicationById(applicationId);
  if (!record) throw new Error("Application not found.");

  await returnApplicationToReview(applicationId, user.id);
  await logActivity({
    actorAdminUserId: user.id,
    action: "application.returned_to_review",
    entityType: "application",
    entityId: applicationId,
    summary: `${user.name} returned "${record.application.stageName || "an application"}" to review.`,
  });

  revalidateApplicationPages(applicationId);
}
