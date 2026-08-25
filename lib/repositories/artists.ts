import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import type {
  Artist,
  BandMember,
  Collaboration,
  GalleryImage,
  PerformanceFormat,
  Release,
  Show,
  Testimonial,
} from "@/types/artist";

// ---------------------------------------------------------------------------
// artists repository — database-backed reads that back lib/artists.ts when
// USE_DATABASE=true. Every function here returns data already shaped as the
// public Artist type (types/artist.ts) so lib/artists.ts's public exports
// don't need any mapping logic of their own, and so every existing public
// page/component under app/artists/[slug]/** keeps working unmodified.
// ---------------------------------------------------------------------------

type ArtistRow = typeof schema.artists.$inferSelect;
type MediaRow = typeof schema.media.$inferSelect;

function mediaUrl(mediaMap: Map<string, MediaRow>, mediaId: string | null): string {
  if (!mediaId) return "";
  return mediaMap.get(mediaId)?.blobUrl ?? "";
}

async function loadArtistMedia(artistId: string): Promise<Map<string, MediaRow>> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.media)
    .where(and(eq(schema.media.ownerType, "artist"), eq(schema.media.ownerId, artistId)));
  return new Map(rows.map((r) => [r.id, r]));
}

async function assembleArtist(row: ArtistRow): Promise<Artist> {
  const db = getDb();
  const mediaMap = await loadArtistMedia(row.id);

  const [releaseRows, videoRows, galleryRows, showRows, bandRows, formatRows, collabRows, testimonialRows] = await Promise.all([
    db.select().from(schema.releases).where(eq(schema.releases.artistId, row.id)),
    db.select().from(schema.artistVideos).where(eq(schema.artistVideos.artistId, row.id)),
    db.select().from(schema.galleryImages).where(eq(schema.galleryImages.artistId, row.id)),
    db.select().from(schema.shows).where(eq(schema.shows.artistId, row.id)),
    db.select().from(schema.bandMembers).where(eq(schema.bandMembers.artistId, row.id)),
    db.select().from(schema.performanceFormats).where(eq(schema.performanceFormats.artistId, row.id)),
    db.select().from(schema.collaborations).where(eq(schema.collaborations.artistId, row.id)),
    db.select().from(schema.testimonials).where(eq(schema.testimonials.artistId, row.id)),
  ]);

  const releases: Release[] = releaseRows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    releaseDate: r.releaseDate,
    coverImage: mediaUrl(mediaMap, r.coverImageMediaId),
    description: r.description,
    trackCount: r.trackCount ?? undefined,
    streamingLinks: r.streamingLinks,
  }));

  const gallery: GalleryImage[] = galleryRows.map((g) => {
    const m = mediaMap.get(g.mediaId);
    return {
      id: g.id,
      src: m?.blobUrl ?? "",
      alt: g.alt,
      category: g.category as GalleryImage["category"],
      width: m?.width ?? 1200,
      height: m?.height ?? 1500,
    };
  });

  const shows: Show[] = showRows.map((s) => ({
    id: s.id,
    date: s.date,
    city: s.city,
    venue: s.venue,
    country: s.country || undefined,
    eventType: s.eventType,
    status: s.status as Show["status"],
    ticketUrl: s.ticketUrl || undefined,
    detailsUrl: s.detailsUrl || undefined,
    isPast: s.isPast,
  }));

  const bandMembers: BandMember[] = bandRows.map((m) => ({
    id: m.id,
    name: m.name,
    role: m.role,
    photo: mediaUrl(mediaMap, m.photoMediaId),
    bio: m.bio,
    instagram: m.instagram || undefined,
  }));

  const performanceFormats: PerformanceFormat[] = formatRows.map((f) => ({
    id: f.formatId as PerformanceFormat["id"],
    name: f.name,
    lineup: f.lineup,
    style: f.style,
    suitableFor: f.suitableFor,
  }));

  const collaborations: Collaboration[] = collabRows.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    logo: mediaUrl(mediaMap, c.logoMediaId) || undefined,
    description: c.description ?? undefined,
  }));

  const testimonials: Testimonial[] = testimonialRows.map((t) => ({
    id: t.id,
    quote: t.quote,
    clientName: t.clientName,
    eventType: t.eventType,
  }));

  const albums = releases.filter((r) => r.type === "album");
  const eps = releases.filter((r) => r.type === "ep");
  const singles = releases.filter((r) => r.type === "single");

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    stageName: row.stageName,
    tagline: row.tagline,
    genre: row.genre,
    location: row.location,
    profileImage: mediaUrl(mediaMap, row.profileImageMediaId),
    heroImage: mediaUrl(mediaMap, row.heroImageMediaId),
    aboutImage: mediaUrl(mediaMap, row.aboutImageMediaId) || mediaUrl(mediaMap, row.heroImageMediaId),
    bio: row.bio,
    shortBio: row.shortBio,
    careerHighlights: row.careerHighlights,
    socialLinks: row.socialLinks,
    streamingLinks: row.streamingLinks,
    albums,
    eps,
    singles,
    videos: videoRows.map((v) => ({
      id: v.id,
      title: v.title,
      description: v.description || undefined,
      platform: v.platform as Artist["videos"][number]["platform"],
      videoId: v.videoId,
      posterImage: mediaUrl(mediaMap, v.posterImageMediaId),
      featured: v.featured,
    })),
    gallery,
    shows,
    bandMembers,
    performanceFormats,
    collaborations,
    testimonials,
    pressKit: {
      heroImage: mediaUrl(mediaMap, row.heroImageMediaId),
      bio: row.pressKit.bio,
      shortBio: row.pressKit.shortBio,
      pressPhotos: gallery.slice(0, 6).map((g) => g.src),
      downloadUrl: row.pressKit.downloadUrl,
    },
    bookingSettings: row.bookingSettings as unknown as Artist["bookingSettings"],
    contactInformation: row.contactInformation,
    instagramHandle: row.instagramHandle ?? undefined,
    instagramFeed: [],
    ogImage: mediaUrl(mediaMap, row.ogImageMediaId) || mediaUrl(mediaMap, row.heroImageMediaId),
    isDemo: false,
    seoTitle: row.seoTitle ?? undefined,
    seoDescription: row.seoDescription ?? undefined,
    canonicalUrl: row.canonicalUrl ?? undefined,
  };
}

export async function getActiveArtists(): Promise<Artist[]> {
  const db = getDb();
  const rows = await db.select().from(schema.artists).where(eq(schema.artists.status, "active"));
  return Promise.all(rows.map(assembleArtist));
}

export async function getArtistBySlugDb(slug: string): Promise<Artist | undefined> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(schema.artists)
    .where(and(eq(schema.artists.slug, slug), eq(schema.artists.status, "active")))
    .limit(1);
  if (!row) return undefined;
  return assembleArtist(row);
}

export async function getAllActiveArtistSlugs(): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .select({ slug: schema.artists.slug })
    .from(schema.artists)
    .where(eq(schema.artists.status, "active"));
  return rows.map((r) => r.slug);
}

/**
 * Phase 4 — Draft Mode preview support (PHASE_4_PLAN.md Section 8): the one
 * read path that intentionally does NOT filter by status='active', so an
 * authenticated admin's preview request can render a draft/inactive/
 * archived artist through the exact same public page component. Never
 * called from any public code path — only from lib/artists.ts's
 * getArtistBySlug when draftMode().isEnabled is true.
 */
export async function getArtistBySlugAnyStatus(slug: string): Promise<Artist | undefined> {
  const db = getDb();
  const [row] = await db.select().from(schema.artists).where(eq(schema.artists.slug, slug)).limit(1);
  if (!row) return undefined;
  return assembleArtist(row);
}

/** Used by the slug-uniqueness check during approval/publishing (lib/slug.ts). `excludeId` skips an artist's own row (renaming while publishing). */
export async function slugExists(slug: string, excludeId?: string): Promise<boolean> {
  const db = getDb();
  const [row] = await db.select({ id: schema.artists.id }).from(schema.artists).where(eq(schema.artists.slug, slug)).limit(1);
  if (!row) return false;
  if (excludeId && row.id === excludeId) return false;
  return true;
}

export async function setArtistStatus(artistId: string, status: "draft" | "active" | "inactive" | "archived") {
  const db = getDb();
  await db
    .update(schema.artists)
    .set({ status, publishedAt: status === "active" ? new Date() : undefined, updatedAt: new Date() })
    .where(eq(schema.artists.id, artistId));
}
