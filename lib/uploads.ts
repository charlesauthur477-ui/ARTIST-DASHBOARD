import type { StagedAsset } from "@/types/application";

// ---------------------------------------------------------------------------
// Media upload abstraction — V1 stub.
//
// There is no media storage provider (Vercel Blob / Cloudinary / S3 /
// Supabase Storage, etc.) connected yet. `stageLocalFile` below is the ONLY
// place in the codebase that touches a selected File — every step of the
// application wizard calls this function rather than reading files
// directly, so wiring up real storage later is a one-function change:
//
//   export async function stageLocalFile(file: File): Promise<StagedAsset> {
//     const uploaded = await uploadToVercelBlob(file); // or Cloudinary/S3/Supabase
//     return { id: uploaded.id, fileName: file.name, fileSizeBytes: file.size,
//               mimeType: file.type, previewUrl: uploaded.publicUrl };
//   }
//
// Today it only creates a browser-local object URL for previewing the file
// in this session — nothing is uploaded anywhere, and the URL stops working
// once the tab/page is closed. Do not treat StagedAsset.previewUrl as a
// permanent or publicly reachable file.
// ---------------------------------------------------------------------------

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
export const ACCEPTED_IMAGE_EXTENSIONS = ".jpg,.jpeg,.png,.webp";
export const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export interface StageFileResult {
  asset: StagedAsset | null;
  error: string | null;
}

function createAssetId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `asset-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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
 * Stages a single local image file for the application form. Client-only
 * (uses URL.createObjectURL) — call from a client component's file input
 * handler. See the module note above for how this will connect to real
 * storage in a future update.
 */
export function stageLocalFile(file: File): StageFileResult {
  const error = validateImageFile(file);
  if (error) return { asset: null, error };

  const asset: StagedAsset = {
    id: createAssetId(),
    fileName: file.name,
    fileSizeBytes: file.size,
    mimeType: file.type,
    previewUrl: URL.createObjectURL(file),
  };
  return { asset, error: null };
}

export function revokeStagedAsset(asset: StagedAsset | null | undefined) {
  if (asset?.previewUrl?.startsWith("blob:")) {
    URL.revokeObjectURL(asset.previewUrl);
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
