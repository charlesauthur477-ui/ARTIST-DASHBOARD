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

/**
 * Phase 4 — global media browser (PHASE_4_PLAN.md Section 7). Lists every
 * media row plus a best-effort "referenced" flag, computed by checking
 * every column across every table that can point at a media id (both
 * artist-side and application-side). A row that isn't referenced anywhere
 * is "orphaned" — the admin media browser surfaces these so a manager can
 * clean them up; ordinary delete stays disabled for referenced media
 * (replace instead) per the plan's stated policy.
 */
export async function listAllMediaWithReferences() {
  const db = getDb();
  const [
    allMedia,
    artistRows,
    releaseRows,
    videoRows,
    galleryRows,
    bandRows,
    collabRows,
    applicationReleaseRows,
    applicationVideoBandRows,
  ] = await Promise.all([
    db.select().from(schema.media),
    db
      .select({
        profileImageMediaId: schema.artists.profileImageMediaId,
        heroImageMediaId: schema.artists.heroImageMediaId,
        aboutImageMediaId: schema.artists.aboutImageMediaId,
        ogImageMediaId: schema.artists.ogImageMediaId,
      })
      .from(schema.artists),
    db.select({ coverImageMediaId: schema.releases.coverImageMediaId }).from(schema.releases),
    db.select({ posterImageMediaId: schema.artistVideos.posterImageMediaId }).from(schema.artistVideos),
    db.select({ mediaId: schema.galleryImages.mediaId }).from(schema.galleryImages),
    db.select({ photoMediaId: schema.bandMembers.photoMediaId }).from(schema.bandMembers),
    db.select({ logoMediaId: schema.collaborations.logoMediaId }).from(schema.collaborations),
    db.select({ artworkMediaId: schema.applicationReleases.artworkMediaId }).from(schema.applicationReleases),
    db.select({ photoMediaId: schema.applicationBandMembers.photoMediaId }).from(schema.applicationBandMembers),
  ]);

  const referenced = new Set<string>();
  for (const row of artistRows) {
    for (const id of [row.profileImageMediaId, row.heroImageMediaId, row.aboutImageMediaId, row.ogImageMediaId]) {
      if (id) referenced.add(id);
    }
  }
  for (const row of releaseRows) if (row.coverImageMediaId) referenced.add(row.coverImageMediaId);
  for (const row of videoRows) if (row.posterImageMediaId) referenced.add(row.posterImageMediaId);
  for (const row of galleryRows) if (row.mediaId) referenced.add(row.mediaId);
  for (const row of bandRows) if (row.photoMediaId) referenced.add(row.photoMediaId);
  for (const row of collabRows) if (row.logoMediaId) referenced.add(row.logoMediaId);
  for (const row of applicationReleaseRows) if (row.artworkMediaId) referenced.add(row.artworkMediaId);
  for (const row of applicationVideoBandRows) if (row.photoMediaId) referenced.add(row.photoMediaId);

  return allMedia
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    .map((m) => ({ ...m, isOrphaned: !referenced.has(m.id) }));
}
