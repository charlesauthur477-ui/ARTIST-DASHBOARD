import type { StagedAsset } from "@/types/application";
import type { MediaRole } from "@/lib/repositories/media";

// ---------------------------------------------------------------------------
// Media upload — client-side helper.
//
// Phase 3: every file selected in the onboarding wizard is uploaded for real
// via the uploadMedia Server Action (lib/media.ts), which stores it in
// Vercel Blob and records a `media` row. This module is the ONLY place a
// client component touches a selected File — every FileInput/MultiFileInput
// calls uploadStagedAsset() rather than reading files directly, so the
// upload mechanism stays a one-module concern.
//
// Uploading happens immediately on file selection (not deferred to final
// submit) so the applicant sees a real "uploaded" state (not "attached —
// not yet uploaded to storage") before they even reach Review & Submit, and
// so a submit doesn't have to also fire off a batch of uploads.
// ---------------------------------------------------------------------------

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
export const ACCEPTED_IMAGE_EXTENSIONS = ".jpg,.jpeg,.png,.webp";
export const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export interface StageFileResult {
  asset: StagedAsset | null;
  error: string | null;
}

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Please upload a JPG, PNG, or WEBP image.";
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "That image is larger than 15MB — please upload a smaller file.";
  }
  return null;
}

/**
 * Uploads a single image file for the application form to permanent
 * storage. Client-only — call from a client component's file input handler.
 * `applicationId` is the draft application's id (see
 * ApplicationWizard.tsx's mount effect, which creates one via
 * createDraftApplication() before any upload can happen) and `role`
 * classifies what the photo is for (see MediaRole in
 * lib/repositories/media.ts) — both are required so the uploaded file's
 * `media` row can be attributed to the right owner and rendered in the
 * right place if/when this application is approved.
 */
export async function uploadStagedAsset(file: File, applicationId: string, role: MediaRole): Promise<StageFileResult> {
  const validationError = validateImageFile(file);
  if (validationError) return { asset: null, error: validationError };

  const { uploadMedia } = await import("@/lib/media");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("ownerType", "application");
  formData.append("ownerId", applicationId);
  formData.append("role", role);

  const result = await uploadMedia(formData);
  if (!result.success || !result.media) {
    return { asset: null, error: result.error ?? "Upload failed. Please try again." };
  }

  const asset: StagedAsset = {
    id: result.media.id,
    fileName: file.name,
    fileSizeBytes: file.size,
    mimeType: file.type,
    previewUrl: result.media.url,
    mediaId: result.media.id,
  };
  return { asset, error: null };
}

/**
 * Removes a previously-uploaded photo — deletes both the Blob object and its
 * `media` row. Safe to call even if `mediaId` is missing (nothing to do).
 */
export async function removeStagedAsset(asset: StagedAsset | null | undefined) {
  if (!asset?.mediaId) return;
  const { deleteMedia } = await import("@/lib/media");
  await deleteMedia(asset.mediaId).catch(() => {
    // Best-effort — if this fails the orphaned file is caught by the
    // periodic cleanup job noted in PHASE_3_PLAN.md Section 6 (not built
    // this phase); it must not block the user from continuing the form.
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
