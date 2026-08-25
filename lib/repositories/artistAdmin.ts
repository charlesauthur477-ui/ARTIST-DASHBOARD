import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { validateSlugForApproval } from "@/lib/slug";
import type { Artist } from "@/types/artist";

// ---------------------------------------------------------------------------
// Admin-only artist repository — PHASE_4_PLAN.md Sections 6 & 8.
//
// Deliberately kept separate from lib/repositories/artists.ts, which is the
// public, read-only surface lib/artists.ts depends on (and which every
// public page transitively relies on staying exactly as-is). Everything
// here is a WRITE path used only from admin Server Actions
// (lib/admin/artistActions.ts). Works identically for approval-created and
// manually-created artists "by construction" — both are just rows in the
// same `artists` table; nothing here or upstream branches on
// sourceApplicationId being set or null.
// ---------------------------------------------------------------------------

export type ArtistRow = typeof schema.artists.$inferSelect;

export interface ArtistListFilters {
  status?: "draft" | "active" | "inactive" | "archived";
  search?: string;
}

export async function listAllArtists(filters: ArtistListFilters = {}) {
  const db = getDb();
  const rows = await db.select().from(schema.artists).orderBy(desc(schema.artists.updatedAt));

  return rows.filter((row) => {
    if (filters.status && row.status !== filters.status) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const haystack = `${row.name} ${row.stageName} ${row.slug} ${row.genre} ${row.location}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export async function getArtistRowById(artistId: string): Promise<ArtistRow | null> {
  const db = getDb();
  const [row] = await db.select().from(schema.artists).where(eq(schema.artists.id, artistId)).limit(1);
  return row ?? null;
}

export interface CreateDraftArtistInput {
  stageName: string;
  slug: string;
  genre: string;
  shortBio: string;
  createdBy: string;
}

/**
 * Manual artist creation (PHASE_4_PLAN.md Section 6 / "Manual Artist
 * Creation"). Always inserted with status='draft' — there is no code path
 * from this function to 'active'; publishing is always a separate, explicit
 * publishArtist() call a manager makes afterward.
 */
export async function createDraftArtist(input: CreateDraftArtistInput): Promise<ArtistRow> {
  const db = getDb();
  const [row] = await db
    .insert(schema.artists)
    .values({
      slug: input.slug,
      status: "draft",
      name: input.stageName,
      stageName: input.stageName,
      genre: input.genre,
      shortBio: input.shortBio,
      bio: input.shortBio,
      careerHighlights: [],
      socialLinks: {},
      streamingLinks: {},
      pressKit: { bio: "", shortBio: input.shortBio, downloadUrl: "" },
      bookingSettings: { eventTypes: [], performanceFormats: [], budgetRanges: [], enquiryNote: "" },
      contactInformation: {
        bookings: { label: "Bookings" },
        management: { label: "Management" },
        press: { label: "Press" },
        general: { label: "General" },
      },
      updatedBy: input.createdBy,
    })
    .returning();
  return row;
}

export interface ArtistProfilePatch {
  name?: string;
  stageName?: string;
  tagline?: string;
  genre?: string;
  location?: string;
  bio?: string;
  shortBio?: string;
  instagramHandle?: string | null;
  socialLinks?: Record<string, string>;
  streamingLinks?: ArtistRow["streamingLinks"];
  careerHighlights?: ArtistRow["careerHighlights"];
  pressKit?: ArtistRow["pressKit"];
  bookingSettings?: ArtistRow["bookingSettings"];
  contactInformation?: ArtistRow["contactInformation"];
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalUrl?: string | null;
  profileImageMediaId?: string | null;
  heroImageMediaId?: string | null;
  aboutImageMediaId?: string | null;
  ogImageMediaId?: string | null;
}

export async function updateArtistProfile(artistId: string, patch: ArtistProfilePatch, updatedBy: string): Promise<void> {
  const db = getDb();
  await db
    .update(schema.artists)
    .set({ ...patch, updatedBy, updatedAt: new Date() })
    .where(eq(schema.artists.id, artistId));
}

// ---------------------------------------------------------------------------
// Repeatable child collections — every replaceX() follows the same
// delete-then-reinsert pattern lib/repositories/applications.ts's
// replaceChildren() already established for application child tables (see
// that file's doc comment for the rationale: the admin editor holds the
// complete authoritative list in memory on save, so a diff isn't needed).
// ---------------------------------------------------------------------------

export async function replaceReleases(artistId: string, items: Omit<typeof schema.releases.$inferInsert, "artistId">[]) {
  const db = getDb();
  await db.delete(schema.releases).where(eq(schema.releases.artistId, artistId));
  if (items.length) await db.insert(schema.releases).values(items.map((item, i) => ({ ...item, artistId, sortOrder: i })));
}

export async function replaceArtistVideos(artistId: string, items: Omit<typeof schema.artistVideos.$inferInsert, "artistId">[]) {
  const db = getDb();
  await db.delete(schema.artistVideos).where(eq(schema.artistVideos.artistId, artistId));
  if (items.length) await db.insert(schema.artistVideos).values(items.map((item, i) => ({ ...item, artistId, sortOrder: i })));
}

export async function replaceGalleryImages(artistId: string, items: Omit<typeof schema.galleryImages.$inferInsert, "artistId">[]) {
  const db = getDb();
  await db.delete(schema.galleryImages).where(eq(schema.galleryImages.artistId, artistId));
  if (items.length) await db.insert(schema.galleryImages).values(items.map((item, i) => ({ ...item, artistId, sortOrder: i })));
}

export async function replaceShows(artistId: string, items: Omit<typeof schema.shows.$inferInsert, "artistId">[]) {
  const db = getDb();
  await db.delete(schema.shows).where(eq(schema.shows.artistId, artistId));
  if (items.length) await db.insert(schema.shows).values(items.map((item, i) => ({ ...item, artistId, sortOrder: i })));
}

export async function replaceBandMembers(artistId: string, items: Omit<typeof schema.bandMembers.$inferInsert, "artistId">[]) {
  const db = getDb();
  await db.delete(schema.bandMembers).where(eq(schema.bandMembers.artistId, artistId));
  if (items.length) await db.insert(schema.bandMembers).values(items.map((item, i) => ({ ...item, artistId, sortOrder: i })));
}

export async function replacePerformanceFormats(artistId: string, items: Omit<typeof schema.performanceFormats.$inferInsert, "artistId">[]) {
  const db = getDb();
  await db.delete(schema.performanceFormats).where(eq(schema.performanceFormats.artistId, artistId));
  if (items.length) await db.insert(schema.performanceFormats).values(items.map((item, i) => ({ ...item, artistId, sortOrder: i })));
}

export async function replaceCollaborations(artistId: string, items: Omit<typeof schema.collaborations.$inferInsert, "artistId">[]) {
  const db = getDb();
  await db.delete(schema.collaborations).where(eq(schema.collaborations.artistId, artistId));
  if (items.length) await db.insert(schema.collaborations).values(items.map((item, i) => ({ ...item, artistId, sortOrder: i })));
}

export async function replaceTestimonials(artistId: string, items: Omit<typeof schema.testimonials.$inferInsert, "artistId">[]) {
  const db = getDb();
  await db.delete(schema.testimonials).where(eq(schema.testimonials.artistId, artistId));
  if (items.length) await db.insert(schema.testimonials).values(items.map((item, i) => ({ ...item, artistId, sortOrder: i })));
}

// ---------------------------------------------------------------------------
// Publishing — PHASE_4_PLAN.md Section 8.
// ---------------------------------------------------------------------------

export interface PublishResult {
  success: boolean;
  error?: string;
}

const REQUIRED_FOR_PUBLISH: { check: (row: ArtistRow) => boolean; message: string }[] = [
  { check: (r) => Boolean(r.stageName?.trim()), message: "Stage name is required before publishing." },
  { check: (r) => Boolean(r.shortBio?.trim()), message: "Short bio is required before publishing." },
  { check: (r) => Boolean(r.profileImageMediaId), message: "A profile photo is required before publishing." },
  { check: (r) => Boolean(r.heroImageMediaId), message: "A hero photo is required before publishing." },
  {
    check: (r) => {
      const contact = r.contactInformation as Artist["contactInformation"] | undefined;
      return Boolean(contact?.general?.email || contact?.bookings?.email);
    },
    message: "At least one contact email (general or bookings) is required before publishing.",
  },
];

/** Used by the Publishing tab to show a live checklist before an admin attempts to publish. */
export function getPublishChecklist(row: ArtistRow): { label: string; ok: boolean }[] {
  return REQUIRED_FOR_PUBLISH.map((rule) => ({ label: rule.message.replace(/ before publishing\.$/, ""), ok: rule.check(row) }));
}

export async function publishArtist(artistId: string, adminId: string): Promise<PublishResult> {
  const row = await getArtistRowById(artistId);
  if (!row) return { success: false, error: "Artist not found." };

  for (const rule of REQUIRED_FOR_PUBLISH) {
    if (!rule.check(row)) return { success: false, error: rule.message };
  }

  const slugCheck = await validateSlugForApproval(row.slug, artistId);
  if (!slugCheck.valid) return { success: false, error: slugCheck.error };

  const db = getDb();
  await db
    .update(schema.artists)
    .set({ status: "active", publishedAt: new Date(), updatedAt: new Date(), updatedBy: adminId })
    .where(eq(schema.artists.id, artistId));

  return { success: true };
}

export async function unpublishArtist(artistId: string, adminId: string): Promise<PublishResult> {
  const row = await getArtistRowById(artistId);
  if (!row) return { success: false, error: "Artist not found." };

  const db = getDb();
  await db
    .update(schema.artists)
    .set({ status: "inactive", updatedAt: new Date(), updatedBy: adminId })
    .where(eq(schema.artists.id, artistId));

  return { success: true };
}

export async function archiveArtist(artistId: string, adminId: string): Promise<PublishResult> {
  const row = await getArtistRowById(artistId);
  if (!row) return { success: false, error: "Artist not found." };

  const db = getDb();
  await db
    .update(schema.artists)
    .set({ status: "archived", updatedAt: new Date(), updatedBy: adminId })
    .where(eq(schema.artists.id, artistId));

  return { success: true };
}
