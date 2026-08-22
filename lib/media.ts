"use server";

import { del, put } from "@vercel/blob";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES } from "@/lib/uploads";
import { deleteMediaRow, getMediaById, insertMedia, type MediaOwnerType, type MediaRole } from "@/lib/repositories/media";

// ---------------------------------------------------------------------------
// Media upload / delete — the ONLY module that talks to Vercel Blob.
//
// BLOB_READ_WRITE_TOKEN is read implicitly by @vercel/blob's put()/del()
// from process.env — never passed through to, or read from, the browser.
// This file is a Server Action module ("use server" at the top), so none of
// its code is ever bundled into client JavaScript.
//
// Called from lib/uploads.ts's client-side `uploadStagedAsset` helper via a
// FormData payload (not a direct object argument) for reliability across the
// client/server boundary with a real File.
// ---------------------------------------------------------------------------

const VALID_OWNER_TYPES: MediaOwnerType[] = ["application", "artist"];
const VALID_ROLES: MediaRole[] = [
  "profile_photo",
  "hero_photo",
  "about_photo",
  "gallery_photo",
  "release_artwork",
  "band_member_photo",
  "press_kit_file",
  "og_image",
];

export interface UploadMediaResult {
  success: boolean;
  media?: { id: string; url: string };
  error?: string;
}

/** Strips path separators and anything that isn't safe in a URL/pathname segment. */
function safeFileSegment(name: string): string {
  const trimmed = name.trim().slice(-120); // guard against absurdly long filenames
  const cleaned = trimmed.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
  return cleaned || "file";
}

export async function uploadMedia(formData: FormData): Promise<UploadMediaResult> {
  const file = formData.get("file");
  const ownerType = formData.get("ownerType");
  const ownerId = formData.get("ownerId");
  const role = formData.get("role");

  if (!(file instanceof File)) {
    return { success: false, error: "No file received." };
  }
  if (typeof ownerType !== "string" || !VALID_OWNER_TYPES.includes(ownerType as MediaOwnerType)) {
    return { success: false, error: "Invalid upload owner." };
  }
  if (typeof ownerId !== "string" || ownerId.length < 1) {
    return { success: false, error: "Invalid upload owner id." };
  }
  if (typeof role !== "string" || !VALID_ROLES.includes(role as MediaRole)) {
    return { success: false, error: "Invalid upload role." };
  }

  // Server-side validation — never trust the client-side check alone (the
  // same principle already applied to form field validation in
  // lib/application.ts and lib/validation/application.ts).
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return { success: false, error: "Please upload a JPG, PNG, or WEBP image." };
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { success: false, error: "That image is larger than 15MB — please upload a smaller file." };
  }

  const safeName = safeFileSegment(file.name);
  const pathname = `${ownerType}s/${ownerId}/${role}/${crypto.randomUUID()}-${safeName}`;

  let blob;
  try {
    blob = await put(pathname, file, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
    });
  } catch (err) {
    console.error("[media] Blob upload failed", err);
    return { success: false, error: "Upload failed. Please try again." };
  }

  try {
    const row = await insertMedia({
      ownerType: ownerType as MediaOwnerType,
      ownerId,
      role: role as MediaRole,
      blobUrl: blob.url,
      blobPathname: blob.pathname,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    });
    return { success: true, media: { id: row.id, url: row.blobUrl } };
  } catch (err) {
    // The file is already in Blob storage but the DB insert failed — clean
    // up rather than leaving an orphaned object with no database record.
    console.error("[media] DB insert failed after successful Blob upload; deleting orphaned blob", err);
    await del(blob.url).catch(() => {});
    return { success: false, error: "Upload could not be saved. Please try again." };
  }
}

export interface DeleteMediaResult {
  success: boolean;
  error?: string;
}

export async function deleteMedia(mediaId: string): Promise<DeleteMediaResult> {
  const row = await getMediaById(mediaId);
  if (!row) return { success: false, error: "Media not found." };

  try {
    await del(row.blobUrl);
  } catch (err) {
    console.error("[media] Blob delete failed", err);
    // Continue — still remove the DB record so the UI doesn't keep
    // referencing a media id the user asked to remove.
  }
  await deleteMediaRow(mediaId);
  return { success: true };
}
