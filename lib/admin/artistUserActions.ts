"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/admin/auth";
import { canEditArtists } from "@/lib/admin/permissions";
import { logActivity } from "@/lib/admin/activity";
import { getArtistRowById } from "@/lib/repositories/artistAdmin";
import { getArtistUserByArtistId, setArtistUserActive, upsertArtistPortalAccess } from "@/lib/repositories/artistUsers";
import { sendEmail } from "@/lib/email/send";
import { artistPortalAccessEmail } from "@/lib/email/templates";

// ---------------------------------------------------------------------------
// Admin-side "Portal Access" management — Sprint 5. This is the ONLY place
// an artist_users row gets created — there is no public sign-up. An admin
// sets (or resets) the artist's login email/password from the artist's
// Overview page; the artist then signs in for themselves at /artist/login
// and can change their own password from Account.
// ---------------------------------------------------------------------------

export interface ArtistUserActionState {
  error: string | null;
  success?: boolean;
}

export async function setArtistPortalAccessAction(
  _prevState: ArtistUserActionState,
  formData: FormData
): Promise<ArtistUserActionState> {
  const user = await requireRole(["super_admin", "manager", "editor"]);
  if (!canEditArtists(user.role)) return { error: "You do not have permission to manage artist portal access." };

  const artistId = String(formData.get("artistId") ?? "");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const notifyArtist = formData.get("notifyArtist") === "on";

  const artist = await getArtistRowById(artistId);
  if (!artist) return { error: "Artist not found." };
  if (!email) return { error: "Email is required." };

  const wasExisting = Boolean(await getArtistUserByArtistId(artistId));
  const result = await upsertArtistPortalAccess(artistId, email, password || undefined);
  if (!result.success) return { error: result.error ?? "Could not save portal access." };

  await logActivity({
    actorAdminUserId: user.id,
    action: wasExisting ? "artist.portal_access_updated" : "artist.portal_access_created",
    entityType: "artist",
    entityId: artistId,
    summary: `${user.name} ${wasExisting ? "updated" : "created"} portal login access for "${artist.stageName || artist.name}".`,
  });

  // Only ever emails the artist when a password was actually set (a brand
  // new login, or an explicit reset) — an email-only update that left the
  // password unchanged has nothing new to tell the artist. Best-effort:
  // never throws, never blocks/undoes the portal access already saved
  // above (mirrors lib/email/bookingNotifications.ts's failure-tolerant
  // pattern) — closes the previous gap where an admin had to manually
  // copy/paste a generated password and relay it to the artist themselves.
  if (password && notifyArtist) {
    try {
      const { subject, html, text } = artistPortalAccessEmail({ email, password, isNewAccount: !wasExisting });
      const sendResult = await sendEmail({ to: email, subject, html, text });
      await logActivity({
        actorAdminUserId: user.id,
        action: sendResult.success ? "artist.portal_access_emailed" : "artist.portal_access_email_failed",
        entityType: "artist",
        entityId: artistId,
        summary: sendResult.success
          ? `Portal login credentials emailed to "${artist.stageName || artist.name}".`
          : `Failed to email portal login credentials to "${artist.stageName || artist.name}".`,
        metadata: { error: sendResult.error },
      });
    } catch (err) {
      console.error("[artist-portal-access] failed to send credentials email", err);
    }
  }

  revalidatePath(`/admin/artists/${artistId}`);
  return { error: null, success: true };
}

export async function setArtistPortalActiveAction(artistId: string, isActive: boolean): Promise<ArtistUserActionState> {
  const user = await requireRole(["super_admin", "manager", "editor"]);
  if (!canEditArtists(user.role)) return { error: "You do not have permission to manage artist portal access." };

  const artist = await getArtistRowById(artistId);
  if (!artist) return { error: "Artist not found." };

  const result = await setArtistUserActive(artistId, isActive);
  if (!result.success) return { error: result.error ?? "Could not update portal access." };

  await logActivity({
    actorAdminUserId: user.id,
    action: "artist.portal_access_updated",
    entityType: "artist",
    entityId: artistId,
    summary: `${user.name} ${isActive ? "reactivated" : "deactivated"} portal access for "${artist.stageName || artist.name}".`,
  });

  revalidatePath(`/admin/artists/${artistId}`);
  return { error: null, success: true };
}
