"use server";

import { revalidatePath } from "next/cache";
import { requireArtistSessionForAction } from "@/lib/artist/session";
import { logActivity } from "@/lib/admin/activity";
import {
  getArtistRowById,
  updateArtistProfile,
  replaceArtistVideos,
  replaceBandMembers,
  replaceCollaborations,
  replaceGalleryImages,
  replacePerformanceFormats,
  replaceReleases,
  replaceShows,
  replaceTestimonials,
  type ArtistProfilePatch,
} from "@/lib/repositories/artistAdmin";
import { schema } from "@/lib/db";

// ---------------------------------------------------------------------------
// Artist Portal CMS Server Actions — Sprint 5.
//
// Deliberately thin: every one of these delegates to the exact same
// lib/repositories/artistAdmin.ts functions the admin CMS
// (lib/admin/artistActions.ts) already calls — no business logic is
// duplicated here. The only two differences from the admin versions are (1)
// authorization — requireArtistSessionForAction() instead of an admin-role
// check, and (2) the artistId is NEVER taken from an argument the client
// could forge; it always comes from the authenticated session
// (user.artistId), so an artist can only ever write to their own row. See
// withArtistSelfAuth() below — every action calls it first and uses
// `row.id`, not any client-supplied id, for every subsequent write.
// ---------------------------------------------------------------------------

async function withArtistSelfAuth() {
  const user = await requireArtistSessionForAction();
  const row = await getArtistRowById(user.artistId);
  if (!row) throw new Error("Artist profile not found.");
  return { user, row };
}

function revalidateArtistPortalPages() {
  revalidatePath("/artist/dashboard");
  revalidatePath("/artist/profile");
  revalidatePath("/artist/photos");
  revalidatePath("/artist/music");
  revalidatePath("/artist/videos");
  revalidatePath("/artist/shows");
  revalidatePath("/artist/band");
  revalidatePath("/artist/performance");
  revalidatePath("/artist/press");
  revalidatePath("/artist/social");
}

function revalidatePublicIfActive(row: { status: string; slug: string }) {
  if (row.status !== "active") return;
  revalidatePath("/");
  revalidatePath(`/artists/${row.slug}`);
  for (const sub of ["about", "band", "booking", "contact", "gallery", "music", "press", "shows"]) {
    revalidatePath(`/artists/${row.slug}/${sub}`);
  }
}

export async function artistUpdateProfileAction(patch: ArtistProfilePatch): Promise<{ error: string | null }> {
  const { user, row } = await withArtistSelfAuth();
  await updateArtistProfile(row.id, patch, null);
  await logActivity({
    actorAdminUserId: null,
    action: "artist.updated",
    entityType: "artist",
    entityId: row.id,
    summary: `${row.stageName || row.name} updated their own profile via the artist portal.`,
    metadata: { artistUserId: user.artistUserId },
  });
  revalidateArtistPortalPages();
  revalidatePublicIfActive(row);
  return { error: null };
}

export async function artistReplaceReleasesAction(items: Omit<typeof schema.releases.$inferInsert, "artistId">[]) {
  const { row } = await withArtistSelfAuth();
  await replaceReleases(row.id, items);
  await logActivity({ actorAdminUserId: null, action: "artist.updated", entityType: "artist", entityId: row.id, summary: `${row.stageName} updated music via the artist portal.` });
  revalidateArtistPortalPages();
  revalidatePublicIfActive(row);
  return { error: null };
}

export async function artistReplaceVideosAction(items: Omit<typeof schema.artistVideos.$inferInsert, "artistId">[]) {
  const { row } = await withArtistSelfAuth();
  await replaceArtistVideos(row.id, items);
  await logActivity({ actorAdminUserId: null, action: "artist.updated", entityType: "artist", entityId: row.id, summary: `${row.stageName} updated videos via the artist portal.` });
  revalidateArtistPortalPages();
  revalidatePublicIfActive(row);
  return { error: null };
}

export async function artistReplaceGalleryAction(items: Omit<typeof schema.galleryImages.$inferInsert, "artistId">[]) {
  const { row } = await withArtistSelfAuth();
  await replaceGalleryImages(row.id, items);
  await logActivity({ actorAdminUserId: null, action: "artist.updated", entityType: "artist", entityId: row.id, summary: `${row.stageName} updated the gallery via the artist portal.` });
  revalidateArtistPortalPages();
  revalidatePublicIfActive(row);
  return { error: null };
}

export async function artistReplaceShowsAction(items: Omit<typeof schema.shows.$inferInsert, "artistId">[]) {
  const { row } = await withArtistSelfAuth();
  await replaceShows(row.id, items);
  await logActivity({ actorAdminUserId: null, action: "artist.updated", entityType: "artist", entityId: row.id, summary: `${row.stageName} updated shows via the artist portal.` });
  revalidateArtistPortalPages();
  revalidatePublicIfActive(row);
  return { error: null };
}

export async function artistReplaceBandMembersAction(items: Omit<typeof schema.bandMembers.$inferInsert, "artistId">[]) {
  const { row } = await withArtistSelfAuth();
  await replaceBandMembers(row.id, items);
  await logActivity({ actorAdminUserId: null, action: "artist.updated", entityType: "artist", entityId: row.id, summary: `${row.stageName} updated band members via the artist portal.` });
  revalidateArtistPortalPages();
  revalidatePublicIfActive(row);
  return { error: null };
}

export async function artistReplacePerformanceFormatsAction(items: Omit<typeof schema.performanceFormats.$inferInsert, "artistId">[]) {
  const { row } = await withArtistSelfAuth();
  await replacePerformanceFormats(row.id, items);
  await logActivity({ actorAdminUserId: null, action: "artist.updated", entityType: "artist", entityId: row.id, summary: `${row.stageName} updated performance formats via the artist portal.` });
  revalidateArtistPortalPages();
  revalidatePublicIfActive(row);
  return { error: null };
}

export async function artistReplaceCollaborationsAction(items: Omit<typeof schema.collaborations.$inferInsert, "artistId">[]) {
  const { row } = await withArtistSelfAuth();
  await replaceCollaborations(row.id, items);
  await logActivity({ actorAdminUserId: null, action: "artist.updated", entityType: "artist", entityId: row.id, summary: `${row.stageName} updated collaborations via the artist portal.` });
  revalidateArtistPortalPages();
  revalidatePublicIfActive(row);
  return { error: null };
}

export async function artistReplaceTestimonialsAction(items: Omit<typeof schema.testimonials.$inferInsert, "artistId">[]) {
  const { row } = await withArtistSelfAuth();
  await replaceTestimonials(row.id, items);
  await logActivity({ actorAdminUserId: null, action: "artist.updated", entityType: "artist", entityId: row.id, summary: `${row.stageName} updated press/testimonials via the artist portal.` });
  revalidateArtistPortalPages();
  revalidatePublicIfActive(row);
  return { error: null };
}
