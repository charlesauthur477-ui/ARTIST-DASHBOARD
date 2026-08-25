"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/admin/auth";
import { canEditArtists, canPublish, canArchiveArtists } from "@/lib/admin/permissions";
import { logActivity } from "@/lib/admin/activity";
import {
  archiveArtist,
  createDraftArtist,
  getArtistRowById,
  publishArtist,
  replaceArtistVideos,
  replaceBandMembers,
  replaceCollaborations,
  replaceGalleryImages,
  replacePerformanceFormats,
  replaceReleases,
  replaceShows,
  replaceTestimonials,
  unpublishArtist,
  updateArtistProfile,
  type ArtistProfilePatch,
} from "@/lib/repositories/artistAdmin";
import { schema } from "@/lib/db";
import { slugify, validateSlugForApproval } from "@/lib/slug";

// ---------------------------------------------------------------------------
// Artist management Server Actions — PHASE_4_PLAN.md Sections 6 & 8.
// ---------------------------------------------------------------------------

const ARTIST_PUBLIC_SUBROUTES = ["about", "band", "booking", "contact", "gallery", "music", "press", "shows"];

function revalidateArtistPublicPages(slug: string) {
  revalidatePath("/");
  revalidatePath(`/artists/${slug}`);
  for (const sub of ARTIST_PUBLIC_SUBROUTES) revalidatePath(`/artists/${slug}/${sub}`);
  revalidatePath("/sitemap.xml");
}

function revalidateAdminArtistPages(artistId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/artists");
  revalidatePath(`/admin/artists/${artistId}`);
}

export interface ArtistActionState {
  error: string | null;
}

export async function createArtistAction(_prevState: ArtistActionState, formData: FormData): Promise<ArtistActionState> {
  const user = await requireRole(["super_admin", "manager", "editor"]);
  if (!canEditArtists(user.role)) return { error: "You do not have permission to create artists." };

  const stageName = String(formData.get("stageName") ?? "").trim();
  const genre = String(formData.get("genre") ?? "").trim();
  const shortBio = String(formData.get("shortBio") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();

  if (!stageName || !genre || !shortBio || !rawSlug) {
    return { error: "Stage name, slug, genre, and short bio are all required." };
  }

  const slug = slugify(rawSlug);
  const slugCheck = await validateSlugForApproval(slug);
  if (!slugCheck.valid) return { error: slugCheck.error ?? "Invalid slug." };

  const artist = await createDraftArtist({ stageName, slug, genre, shortBio, createdBy: user.id });

  await logActivity({
    actorAdminUserId: user.id,
    action: "artist.created",
    entityType: "artist",
    entityId: artist.id,
    summary: `${user.name} manually created artist "${stageName}" (draft).`,
  });

  revalidateAdminArtistPages(artist.id);
  redirect(`/admin/artists/${artist.id}`);
}

export async function updateArtistProfileAction(artistId: string, patch: ArtistProfilePatch): Promise<{ error: string | null }> {
  const user = await requireRole(["super_admin", "manager", "editor"]);
  if (!canEditArtists(user.role)) return { error: "You do not have permission to edit artists." };

  const row = await getArtistRowById(artistId);
  if (!row) return { error: "Artist not found." };

  await updateArtistProfile(artistId, patch, user.id);
  await logActivity({
    actorAdminUserId: user.id,
    action: "artist.updated",
    entityType: "artist",
    entityId: artistId,
    summary: `${user.name} updated "${row.stageName || row.name}".`,
  });

  revalidateAdminArtistPages(artistId);
  if (row.status === "active") revalidateArtistPublicPages(row.slug);
  return { error: null };
}

// ---------------------------------------------------------------------------
// Repeatable collections — one thin, uniformly-shaped action per collection,
// each authorizing then delegating to the matching replaceX() repository
// function (lib/repositories/artistAdmin.ts). Used by
// components/admin/artists/RepeatableListEditor.tsx via the Music, Videos,
// Shows, Band, Performance, and Press tabs.
// ---------------------------------------------------------------------------

async function withArtistCollectionAuth(artistId: string) {
  const user = await requireRole(["super_admin", "manager", "editor"]);
  if (!canEditArtists(user.role)) return { error: "You do not have permission to edit artists." as const, user: null };
  const row = await getArtistRowById(artistId);
  if (!row) return { error: "Artist not found." as const, user: null };
  return { error: null, user, row };
}

export async function replaceReleasesAction(artistId: string, items: Omit<typeof schema.releases.$inferInsert, "artistId">[]) {
  const auth = await withArtistCollectionAuth(artistId);
  if (auth.error || !auth.user || !auth.row) return { error: auth.error ?? "Not authorized." };
  await replaceReleases(artistId, items);
  await logActivity({ actorAdminUserId: auth.user.id, action: "artist.updated", entityType: "artist", entityId: artistId, summary: `${auth.user.name} updated music for "${auth.row.stageName}".` });
  revalidateAdminArtistPages(artistId);
  if (auth.row.status === "active") revalidateArtistPublicPages(auth.row.slug);
  return { error: null };
}

export async function replaceVideosAction(artistId: string, items: Omit<typeof schema.artistVideos.$inferInsert, "artistId">[]) {
  const auth = await withArtistCollectionAuth(artistId);
  if (auth.error || !auth.user || !auth.row) return { error: auth.error ?? "Not authorized." };
  await replaceArtistVideos(artistId, items);
  await logActivity({ actorAdminUserId: auth.user.id, action: "artist.updated", entityType: "artist", entityId: artistId, summary: `${auth.user.name} updated videos for "${auth.row.stageName}".` });
  revalidateAdminArtistPages(artistId);
  if (auth.row.status === "active") revalidateArtistPublicPages(auth.row.slug);
  return { error: null };
}

export async function replaceGalleryAction(artistId: string, items: Omit<typeof schema.galleryImages.$inferInsert, "artistId">[]) {
  const auth = await withArtistCollectionAuth(artistId);
  if (auth.error || !auth.user || !auth.row) return { error: auth.error ?? "Not authorized." };
  await replaceGalleryImages(artistId, items);
  await logActivity({ actorAdminUserId: auth.user.id, action: "artist.updated", entityType: "artist", entityId: artistId, summary: `${auth.user.name} updated the gallery for "${auth.row.stageName}".` });
  revalidateAdminArtistPages(artistId);
  if (auth.row.status === "active") revalidateArtistPublicPages(auth.row.slug);
  return { error: null };
}

export async function replaceShowsAction(artistId: string, items: Omit<typeof schema.shows.$inferInsert, "artistId">[]) {
  const auth = await withArtistCollectionAuth(artistId);
  if (auth.error || !auth.user || !auth.row) return { error: auth.error ?? "Not authorized." };
  await replaceShows(artistId, items);
  await logActivity({ actorAdminUserId: auth.user.id, action: "artist.updated", entityType: "artist", entityId: artistId, summary: `${auth.user.name} updated shows for "${auth.row.stageName}".` });
  revalidateAdminArtistPages(artistId);
  if (auth.row.status === "active") revalidateArtistPublicPages(auth.row.slug);
  return { error: null };
}

export async function replaceBandMembersAction(artistId: string, items: Omit<typeof schema.bandMembers.$inferInsert, "artistId">[]) {
  const auth = await withArtistCollectionAuth(artistId);
  if (auth.error || !auth.user || !auth.row) return { error: auth.error ?? "Not authorized." };
  await replaceBandMembers(artistId, items);
  await logActivity({ actorAdminUserId: auth.user.id, action: "artist.updated", entityType: "artist", entityId: artistId, summary: `${auth.user.name} updated band members for "${auth.row.stageName}".` });
  revalidateAdminArtistPages(artistId);
  if (auth.row.status === "active") revalidateArtistPublicPages(auth.row.slug);
  return { error: null };
}

export async function replacePerformanceFormatsAction(artistId: string, items: Omit<typeof schema.performanceFormats.$inferInsert, "artistId">[]) {
  const auth = await withArtistCollectionAuth(artistId);
  if (auth.error || !auth.user || !auth.row) return { error: auth.error ?? "Not authorized." };
  await replacePerformanceFormats(artistId, items);
  await logActivity({ actorAdminUserId: auth.user.id, action: "artist.updated", entityType: "artist", entityId: artistId, summary: `${auth.user.name} updated performance formats for "${auth.row.stageName}".` });
  revalidateAdminArtistPages(artistId);
  if (auth.row.status === "active") revalidateArtistPublicPages(auth.row.slug);
  return { error: null };
}

export async function replaceCollaborationsAction(artistId: string, items: Omit<typeof schema.collaborations.$inferInsert, "artistId">[]) {
  const auth = await withArtistCollectionAuth(artistId);
  if (auth.error || !auth.user || !auth.row) return { error: auth.error ?? "Not authorized." };
  await replaceCollaborations(artistId, items);
  await logActivity({ actorAdminUserId: auth.user.id, action: "artist.updated", entityType: "artist", entityId: artistId, summary: `${auth.user.name} updated collaborations for "${auth.row.stageName}".` });
  revalidateAdminArtistPages(artistId);
  if (auth.row.status === "active") revalidateArtistPublicPages(auth.row.slug);
  return { error: null };
}

export async function replaceTestimonialsAction(artistId: string, items: Omit<typeof schema.testimonials.$inferInsert, "artistId">[]) {
  const auth = await withArtistCollectionAuth(artistId);
  if (auth.error || !auth.user || !auth.row) return { error: auth.error ?? "Not authorized." };
  await replaceTestimonials(artistId, items);
  await logActivity({ actorAdminUserId: auth.user.id, action: "artist.updated", entityType: "artist", entityId: artistId, summary: `${auth.user.name} updated testimonials for "${auth.row.stageName}".` });
  revalidateAdminArtistPages(artistId);
  if (auth.row.status === "active") revalidateArtistPublicPages(auth.row.slug);
  return { error: null };
}

export async function publishArtistAction(formData: FormData): Promise<void> {
  const user = await requireRole(["super_admin", "manager"]);
  if (!canPublish(user.role)) throw new Error("You do not have permission to publish artists.");

  const artistId = String(formData.get("artistId") ?? "");
  if (!artistId) throw new Error("Missing artist id.");

  const row = await getArtistRowById(artistId);
  if (!row) throw new Error("Artist not found.");

  const result = await publishArtist(artistId, user.id);
  if (!result.success) throw new Error(result.error ?? "Publish failed.");

  await logActivity({
    actorAdminUserId: user.id,
    action: "artist.published",
    entityType: "artist",
    entityId: artistId,
    summary: `${user.name} published "${row.stageName || row.name}".`,
  });

  revalidateAdminArtistPages(artistId);
  revalidateArtistPublicPages(row.slug);
}

export async function unpublishArtistAction(formData: FormData): Promise<void> {
  const user = await requireRole(["super_admin", "manager"]);
  if (!canPublish(user.role)) throw new Error("You do not have permission to unpublish artists.");

  const artistId = String(formData.get("artistId") ?? "");
  if (!artistId) throw new Error("Missing artist id.");

  const row = await getArtistRowById(artistId);
  if (!row) throw new Error("Artist not found.");

  const result = await unpublishArtist(artistId, user.id);
  if (!result.success) throw new Error(result.error ?? "Unpublish failed.");

  await logActivity({
    actorAdminUserId: user.id,
    action: "artist.unpublished",
    entityType: "artist",
    entityId: artistId,
    summary: `${user.name} unpublished "${row.stageName || row.name}".`,
  });

  revalidateAdminArtistPages(artistId);
  // Re-revalidate the public routes too — unpublishing must immediately
  // stop the artist from being served, not just stop showing up in admin.
  revalidateArtistPublicPages(row.slug);
}

export async function archiveArtistAction(formData: FormData): Promise<void> {
  const user = await requireRole(["super_admin", "manager"]);
  if (!canArchiveArtists(user.role)) throw new Error("You do not have permission to archive artists.");

  const artistId = String(formData.get("artistId") ?? "");
  if (!artistId) throw new Error("Missing artist id.");

  const row = await getArtistRowById(artistId);
  if (!row) throw new Error("Artist not found.");

  const result = await archiveArtist(artistId, user.id);
  if (!result.success) throw new Error(result.error ?? "Archive failed.");

  await logActivity({
    actorAdminUserId: user.id,
    action: "artist.archived",
    entityType: "artist",
    entityId: artistId,
    summary: `${user.name} archived "${row.stageName || row.name}".`,
  });

  revalidateAdminArtistPages(artistId);
  revalidateArtistPublicPages(row.slug);
}
