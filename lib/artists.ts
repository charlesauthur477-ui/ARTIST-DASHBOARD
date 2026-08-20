import { artists } from "@/data/artists";
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
// importing the static data directly. For V1 they simply read from the
// static in-memory array in /data/artists. When a real backend exists, only
// this file needs to change (e.g. swap the bodies for `fetch`/DB calls) —
// no page or component needs to be rewritten.
// ---------------------------------------------------------------------------

export function getAllArtists(): Artist[] {
  return artists;
}

export function getArtistBySlug(slug: string): Artist | undefined {
  return artists.find((artist) => artist.slug === slug);
}

export function getAllArtistSlugs(): string[] {
  return artists.map((artist) => artist.slug);
}

export function getArtistReleases(slug: string): Release[] {
  const artist = getArtistBySlug(slug);
  if (!artist) return [];
  return [...artist.albums, ...artist.eps, ...artist.singles].sort(
    (a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
  );
}

export function getArtistLatestRelease(slug: string): Release | undefined {
  return getArtistReleases(slug)[0];
}

export function getArtistGallery(slug: string): GalleryImage[] {
  return getArtistBySlug(slug)?.gallery ?? [];
}

export function getArtistShows(slug: string, options?: { upcomingOnly?: boolean; pastOnly?: boolean }): Show[] {
  const artist = getArtistBySlug(slug);
  if (!artist) return [];
  const sorted = [...artist.shows].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  if (options?.upcomingOnly) return sorted.filter((s) => !s.isPast);
  if (options?.pastOnly) return sorted.filter((s) => s.isPast).reverse();
  return sorted;
}

export function getArtistBand(slug: string): BandMember[] {
  return getArtistBySlug(slug)?.bandMembers ?? [];
}

export function getArtistPerformanceFormats(slug: string): PerformanceFormat[] {
  return getArtistBySlug(slug)?.performanceFormats ?? [];
}

export function getArtistBookingSettings(slug: string): BookingSettings | undefined {
  return getArtistBySlug(slug)?.bookingSettings;
}

export function getArtistContactInformation(slug: string): ContactInformation | undefined {
  return getArtistBySlug(slug)?.contactInformation;
}
