import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

// ---------------------------------------------------------------------------
// media repository — the only module that reads/writes the `media` table
// directly. Called by lib/media.ts (the upload/delete Server Actions) and by
// lib/repositories/approvals.ts (to re-point media ownership on approval).
// ---------------------------------------------------------------------------

export type MediaOwnerType = "application" | "artist";

export type MediaRole =
  | "profile_photo"
  | "hero_photo"
  | "about_photo"
  | "gallery_photo"
  | "release_artwork"
  | "band_member_photo"
  | "press_kit_file"
  | "og_image";

export interface InsertMediaInput {
  ownerType: MediaOwnerType;
  ownerId: string;
  role: MediaRole;
  blobUrl: string;
  blobPathname: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  metadata?: Record<string, string>;
}

export async function insertMedia(input: InsertMediaInput) {
  const db = getDb();
  const [row] = await db
    .insert(schema.media)
    .values({
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      role: input.role,
      blobUrl: input.blobUrl,
      blobPathname: input.blobPathname,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      width: input.width,
      height: input.height,
      metadata: input.metadata ?? {},
    })
    .returning();
  return row;
}

export async function getMediaById(id: string) {
  const db = getDb();
  const [row] = await db.select().from(schema.media).where(eq(schema.media.id, id)).limit(1);
  return row ?? null;
}

export async function getMediaByOwner(ownerType: MediaOwnerType, ownerId: string) {
  const db = getDb();
  return db
    .select()
    .from(schema.media)
    .where(and(eq(schema.media.ownerType, ownerType), eq(schema.media.ownerId, ownerId)));
}

export async function deleteMediaRow(id: string) {
  const db = getDb();
  const [row] = await db.delete(schema.media).where(eq(schema.media.id, id)).returning();
  return row ?? null;
}
