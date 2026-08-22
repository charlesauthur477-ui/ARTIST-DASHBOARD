import { artists as staticArtists } from "@/data/artists";
import type {
  Artist,
  BandMember,
  BookingSettings,
  ContactInformation,
  GalleryImage,
  PerformanceFormat,
  Release,
  Show,
} from "@/types/artist";

// ---------------------------------------------------------------------------
// Data access layer
//
// Every page/component reads artist data through these functions rather than
// importing the static data directly — that seam is what makes the Phase 3
// database cutover below possible without touching any page or component.
//
// USE_DATABASE (Phase 3): when the DATABASE_URL env var is set AND
// USE_DATABASE is not explicitly "false", getAllArtists/getArtistBySlug/
// getAllArtistSlugs read from Postgres via lib/repositories/artists.ts.
// Otherwise (no database configured, or USE_DATABASE=false) they fall back
// to the static demo data in /data/artists, exactly as in V1/Phase 2. This
// is a deliberate migration safety net per PHASE_3_PLAN.md Section 9 — the
// public site must never break because the database isn't ready or is
// briefly unavailable, and the static demo data is not deleted.
//
// Because every other exported function in this file (getArtistShows,
// getArtistGallery, etc.) is implemented in terms of getArtistBySlug below,
// they automatically become database-backed too once the flag is on — no
// separate database-path implementation needed for them here.
// ---------------------------------------------------------------------------

export function isDatabaseEnabled(): boolean {
  if (process.env.USE_DATABASE === "false") return false;
  return Boolean(process.env.DATABASE_URL);
}

export async function getAllArtists(): Promise<Artist[]> {
  if (isDatabaseEnabled()) {
    const { getActiveArtists } = await import("@/lib/repositories/artists");
    return getActiveArtists();
  }
  return staticArtists;
}

export async function getArtistBySlug(slug: string): Promise<Artist | undefined> {
  if (isDatabaseEnabled()) {
    const { getArtistBySlugDb } = await import("@/lib/repositories/artists");
    return getArtistBySlugDb(slug);
  }
  return staticArtists.find((artist) => artist.slug === slug);
}

export async function getAllArtistSlugs(): Promise<string[]> {
  if (isDatabaseEnabled()) {
    const { getAllActiveArtistSlugs } = await import("@/lib/repositories/artists");
    return getAllActiveArtistSlugs();
  }
  return staticArtists.map((artist) => artist.slug);
}

export async function getArtistReleases(slug: string): Promise<Release[]> {
  const artist = await getArtistBySlug(slug);
  if (!artist) return [];
  return [...artist.albums, ...artist.eps, ...artist.singles].sort(
    (a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
  );
}

export async function getArtistLatestRelease(slug: string): Promise<Release | undefined> {
  return (await getArtistReleases(slug))[0];
}

export async function getArtistGallery(slug: string): Promise<GalleryImage[]> {
  return (await getArtistBySlug(slug))?.gallery ?? [];
}

export async function getArtistShows(
  slug: string,
  options?: { upcomingOnly?: boolean; pastOnly?: boolean }
): Promise<Show[]> {
  const artist = await getArtistBySlug(slug);
  if (!artist) return [];
  const sorted = [...artist.shows].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  if (options?.upcomingOnly) return sorted.filter((s) => !s.isPast);
  if (options?.pastOnly) return sorted.filter((s) => s.isPast).reverse();
  return sorted;
}

export async function getArtistBand(slug: string): Promise<BandMember[]> {
  return (await getArtistBySlug(slug))?.bandMembers ?? [];
}

export async function getArtistPerformanceFormats(slug: string): Promise<PerformanceFormat[]> {
  return (await getArtistBySlug(slug))?.performanceFormats ?? [];
}

export async function getArtistBookingSettings(slug: string): Promise<BookingSettings | undefined> {
  return (await getArtistBySlug(slug))?.bookingSettings;
}

export async function getArtistContactInformation(slug: string): Promise<ContactInformation | undefined> {
  return (await getArtistBySlug(slug))?.contactInformation;
}
