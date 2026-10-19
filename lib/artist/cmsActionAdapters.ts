"use server";

// ---------------------------------------------------------------------------
// ROOT CAUSE (Artist Portal navigation audit, follow-up):
// These functions used to be plain (non-"use server") wrapper functions that
// re-shape a Tab component's UI item list before delegating to the real
// Server Actions in lib/artist/cmsActions.ts. That worked for the ADMIN Tab
// components' *default* save path because those components import the real
// "use server" action (e.g. replacePerformanceFormatsAction) directly inside
// the same "use client" file and call it themselves — the function reference
// never has to cross a Server Component -> Client Component prop boundary.
//
// The Artist Portal pages, however, are Server Components that pass one of
// these wrapper functions down as a *prop* (`saveAction={artistSaveXxx}`) to
// the Client Component. Next.js only allows a function value to cross that
// boundary when it is itself a recognized Server Action reference — i.e. an
// exported async function from a module marked "use server". A plain
// wrapper function (even one that internally calls a real Server Action) is
// just a normal closure to the RSC serializer, which is why React threw:
// "Functions cannot be passed directly to Client Components unless you
// explicitly expose it by marking it with 'use server'."
//
// Fix: mark this whole file "use server" and make every export a real async
// function, so each one is itself a valid Server Action that can be handed
// to a Client Component as a prop. The mapping logic inside each function is
// unchanged — only the export itself is now a first-class Server Action.
// ---------------------------------------------------------------------------

import {
  artistReplaceBandMembersAction,
  artistReplaceCollaborationsAction,
  artistReplaceGalleryAction,
  artistReplacePerformanceFormatsAction,
  artistReplaceReleasesAction,
  artistReplaceShowsAction,
  artistReplaceTestimonialsAction,
  artistReplaceVideosAction,
  artistUpdateProfileAction,
} from "@/lib/artist/cmsActions";
import type { BandMemberItem } from "@/components/admin/artists/BandTab";
import type { ReleaseItem } from "@/components/admin/artists/MusicTab";
import type { VideoItem } from "@/components/admin/artists/VideosTab";
import type { ShowItem } from "@/components/admin/artists/ShowsTab";
import type { PerformanceFormatItem } from "@/components/admin/artists/PerformanceTab";
import type { GalleryItem } from "@/components/admin/artists/GalleryTab";
import type { CollaborationItem, TestimonialItem } from "@/components/admin/artists/PressTab";

// ---------------------------------------------------------------------------
// Adapters between each Tab component's UI item shape and the
// artistReplaceX() Server Actions (lib/artist/cmsActions.ts), which — like
// their admin counterparts in lib/admin/artistActions.ts — expect the
// database insert shape. Mirrors exactly the same field mapping each admin
// Tab component already does inline for its default (admin) save path; kept
// here once so every /artist/* page can just pass these as `saveAction`
// without re-deriving the mapping per page.
// ---------------------------------------------------------------------------

export async function artistSaveBandMembers(all: BandMemberItem[]) {
  return artistReplaceBandMembersAction(
    all.map((item) => ({
      name: item.name,
      role: item.role,
      bio: item.bio,
      instagram: item.instagram || null,
      photoMediaId: item.photoMediaId,
    }))
  );
}

export async function artistSaveReleases(all: ReleaseItem[]) {
  return artistReplaceReleasesAction(
    all.map((item) => ({
      type: item.type,
      title: item.title,
      releaseDate: item.releaseDate,
      coverImageMediaId: item.coverImageMediaId,
      description: item.description,
      trackCount: item.trackCount ?? undefined,
      streamingLinks: item.streamingLinks,
    }))
  );
}

export async function artistSaveVideos(all: VideoItem[]) {
  return artistReplaceVideosAction(
    all.map((item) => ({
      title: item.title,
      description: item.description,
      platform: item.platform,
      videoId: item.videoId,
      posterImageMediaId: item.posterImageMediaId,
      featured: item.featured,
    }))
  );
}

export async function artistSaveShows(all: ShowItem[]) {
  return artistReplaceShowsAction(
    all.map((item) => ({
      date: item.date,
      city: item.city,
      venue: item.venue,
      country: item.country,
      eventType: item.eventType,
      status: item.status,
      ticketUrl: item.ticketUrl || null,
      detailsUrl: item.detailsUrl || null,
      isPast: item.isPast,
    }))
  );
}

export async function artistSavePerformanceFormats(all: PerformanceFormatItem[]) {
  return artistReplacePerformanceFormatsAction(
    all.map((item) => ({
      formatId: item.formatId,
      name: item.name,
      lineup: item.lineup,
      style: item.style,
      suitableFor: item.suitableFor
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    }))
  );
}

export async function artistSaveGallery(all: GalleryItem[]) {
  return artistReplaceGalleryAction(
    all.filter((item) => item.mediaId).map((item) => ({ mediaId: item.mediaId as string, alt: item.alt, category: item.category }))
  );
}

export async function artistSaveCollaborations(all: CollaborationItem[]) {
  return artistReplaceCollaborationsAction(
    all.map((item) => ({
      name: item.name,
      type: item.type,
      logoMediaId: item.logoMediaId,
      description: item.description || null,
    }))
  );
}

export async function artistSaveTestimonials(all: TestimonialItem[]) {
  return artistReplaceTestimonialsAction(all);
}

export async function artistSavePressKit(kit: { bio: string; shortBio: string; downloadUrl: string }) {
  return artistUpdateProfileAction({ pressKit: kit });
}
