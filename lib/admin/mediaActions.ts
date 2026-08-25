"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/admin/auth";
import { canManageMedia } from "@/lib/admin/permissions";
import { logActivity } from "@/lib/admin/activity";
import { deleteMedia } from "@/lib/media";
import { getMediaById } from "@/lib/repositories/media";
import { listAllMediaWithReferences } from "@/lib/repositories/media";

// ---------------------------------------------------------------------------
// Media management Server Actions — PHASE_4_PLAN.md Section 7.
//
// Deletion is deliberately restricted to orphaned (unreferenced) media —
// "delete disabled for currently-referenced media, replace instead," per
// the plan. Re-checks orphan status server-side rather than trusting
// whatever the browser last rendered, since the reference set can change
// between page load and click.
// ---------------------------------------------------------------------------

export async function deleteOrphanedMediaAction(formData: FormData): Promise<void> {
  const user = await requireRole(["super_admin", "manager", "editor"]);
  if (!canManageMedia(user.role)) throw new Error("You do not have permission to manage media.");

  const mediaId = String(formData.get("mediaId") ?? "");
  if (!mediaId) throw new Error("Missing media id.");

  const row = await getMediaById(mediaId);
  if (!row) throw new Error("Media not found.");

  const all = await listAllMediaWithReferences();
  const current = all.find((m) => m.id === mediaId);
  if (!current || !current.isOrphaned) {
    throw new Error("This file is still in use by an artist or application and cannot be deleted. Replace it from that item's editor instead.");
  }

  const result = await deleteMedia(mediaId);
  if (!result.success) throw new Error(result.error ?? "Delete failed.");

  await logActivity({
    actorAdminUserId: user.id,
    action: "media.removed",
    entityType: "media",
    entityId: mediaId,
    summary: `${user.name} deleted an unused media file (${row.fileName}).`,
  });

  revalidatePath("/admin/media");
}
