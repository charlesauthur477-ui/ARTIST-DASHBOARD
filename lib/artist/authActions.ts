"use server";

import { redirect } from "next/navigation";
import {
  verifyArtistCredentials,
  changeArtistPassword,
  createPasswordResetToken,
  resetPasswordWithToken,
} from "@/lib/repositories/artistUsers";
import { createArtistSession, clearArtistSession, requireArtistSessionForAction } from "@/lib/artist/session";
import { logActivity } from "@/lib/admin/activity";
import { getArtistRowById } from "@/lib/repositories/artistAdmin";
import { sendEmail } from "@/lib/email/send";
import { artistPasswordResetEmail } from "@/lib/email/templates";
import { siteUrl } from "@/lib/siteUrl";

export interface ArtistAuthState {
  error: string | null;
}

export async function artistLoginAction(_prevState: ArtistAuthState, formData: FormData): Promise<ArtistAuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/artist/dashboard");

  if (!email || !password) return { error: "Email and password are required." };

  const artistUser = await verifyArtistCredentials(email, password);
  if (!artistUser) return { error: "Invalid email or password." };

  await createArtistSession(artistUser.id);

  const artist = await getArtistRowById(artistUser.artistId);
  await logActivity({
    actorAdminUserId: null,
    action: "artist.portal_signed_in",
    entityType: "artist",
    entityId: artistUser.artistId,
    summary: `${artist?.stageName || artist?.name || "An artist"} signed in to the artist portal.`,
  });

  redirect(callbackUrl.startsWith("/artist") ? callbackUrl : "/artist/dashboard");
}

export async function artistLogoutAction(): Promise<void> {
  await clearArtistSession();
  redirect("/artist/login");
}

export interface ArtistForgotPasswordState {
  error: string | null;
  success?: boolean;
}

// NOTE: the response below is deliberately identical whether or not the
// email matched an account — the generic message is rendered by
// ArtistForgotPasswordForm.tsx, never derived from anything account-
// specific here, so account existence can never leak via this form.

export async function requestArtistPasswordResetAction(
  _prevState: ArtistForgotPasswordState,
  formData: FormData
): Promise<ArtistForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Please enter your email address." };

  try {
    const result = await createPasswordResetToken(email);
    if (result) {
      const resetUrl = siteUrl(`/artist/reset-password?token=${result.token}`);
      const { subject, html, text } = artistPasswordResetEmail(resetUrl);
      await sendEmail({ to: email, subject, html, text });

      const artist = await getArtistRowById(result.artistId);
      await logActivity({
        actorAdminUserId: null,
        action: "artist.password_reset_requested",
        entityType: "artist",
        entityId: result.artistId,
        summary: `${artist?.stageName || artist?.name || "An artist"} requested an Artist Portal password reset.`,
      });
    }
    // Intentionally identical response whether or not `result` was null —
    // see FORGOT_PASSWORD_GENERIC_MESSAGE above.
  } catch (err) {
    // Never let a lookup/send failure reveal anything different to the
    // caller than the "no matching account" path would — log server-side
    // only.
    console.error("[artist] password reset request failed", err);
  }

  return { error: null, success: true };
}

export interface ArtistResetPasswordState {
  error: string | null;
  success?: boolean;
}

export async function resetArtistPasswordAction(
  _prevState: ArtistResetPasswordState,
  formData: FormData
): Promise<ArtistResetPasswordState> {
  const token = String(formData.get("token") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!token) return { error: "This reset link is invalid. Please request a new one." };
  if (!newPassword || newPassword !== confirmPassword) return { error: "Passwords do not match." };

  const result = await resetPasswordWithToken(token, newPassword);
  if (!result.success) return { error: result.error ?? "Could not reset password." };

  await logActivity({
    actorAdminUserId: null,
    action: "artist.password_reset_completed",
    entityType: "artist",
    entityId: null,
    summary: "An Artist Portal password was reset via the self-service reset link.",
  });

  return { error: null, success: true };
}

export interface ArtistPasswordChangeState {
  error: string | null;
  success?: boolean;
}

export async function changeArtistPasswordAction(
  _prevState: ArtistPasswordChangeState,
  formData: FormData
): Promise<ArtistPasswordChangeState> {
  const user = await requireArtistSessionForAction();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !newPassword) return { error: "All fields are required." };
  if (newPassword !== confirmPassword) return { error: "New passwords do not match." };

  const result = await changeArtistPassword(user.artistUserId, currentPassword, newPassword);
  if (!result.success) return { error: result.error ?? "Could not change password." };

  return { error: null, success: true };
}
