import { desc, eq, inArray } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

// ---------------------------------------------------------------------------
// Admin dashboard home queries — PHASE_4_PLAN.md Section 4.
//
// Kept as its own small repository module rather than added to
// lib/repositories/artists.ts (public-read-only surface used by
// lib/artists.ts) or lib/repositories/applications.ts, since these are
// admin-only aggregate reads across tables, not part of the public data
// path.
// ---------------------------------------------------------------------------

export interface DashboardCounts {
  totalArtists: number;
  publishedArtists: number;
  draftArtists: number;
  pendingApplications: number;
}

export async function getDashboardCounts(): Promise<DashboardCounts> {
  const db = getDb();
  const [artistRows, pendingRows] = await Promise.all([
    db.select({ status: schema.artists.status }).from(schema.artists),
    db
      .select({ id: schema.artistApplications.id })
      .from(schema.artistApplications)
      .where(inArray(schema.artistApplications.status, ["submitted", "under_review"])),
  ]);

  return {
    totalArtists: artistRows.length,
    publishedArtists: artistRows.filter((r) => r.status === "active").length,
    draftArtists: artistRows.filter((r) => r.status === "draft").length,
    pendingApplications: pendingRows.length,
  };
}

export async function getRecentApplications(limit = 5) {
  const db = getDb();
  return db
    .select({
      id: schema.artistApplications.id,
      stageName: schema.artistApplications.stageName,
      status: schema.artistApplications.status,
      primaryGenre: schema.artistApplications.primaryGenre,
      city: schema.artistApplications.city,
      country: schema.artistApplications.country,
      submittedAt: schema.artistApplications.submittedAt,
      createdAt: schema.artistApplications.createdAt,
    })
    .from(schema.artistApplications)
    .orderBy(desc(schema.artistApplications.createdAt))
    .limit(limit);
}

export async function getRecentlyUpdatedArtists(limit = 5) {
  const db = getDb();
  return db
    .select({
      id: schema.artists.id,
      slug: schema.artists.slug,
      name: schema.artists.name,
      stageName: schema.artists.stageName,
      status: schema.artists.status,
      updatedAt: schema.artists.updatedAt,
    })
    .from(schema.artists)
    .orderBy(desc(schema.artists.updatedAt))
    .limit(limit);
}

export async function getUpcomingShowsForPublishedArtists(limit = 5) {
  const db = getDb();
  const publishedArtists = await db
    .select({ id: schema.artists.id, name: schema.artists.name, slug: schema.artists.slug })
    .from(schema.artists)
    .where(eq(schema.artists.status, "active"));

  if (!publishedArtists.length) return [];

  const artistById = new Map(publishedArtists.map((a) => [a.id, a]));
  const showRows = await db
    .select()
    .from(schema.shows)
    .where(inArray(schema.shows.artistId, publishedArtists.map((a) => a.id)));

  return showRows
    .filter((s) => !s.isPast)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, limit)
    .map((s) => ({ ...s, artist: artistById.get(s.artistId) }));
}
