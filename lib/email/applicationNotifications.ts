import "server-only";
import { sendEmail } from "@/lib/email/send";
import { getAdminNotificationRecipients } from "@/lib/email/recipients";
import { newApplicationAdminEmail } from "@/lib/email/templates";
import { logActivity } from "@/lib/admin/activity";

// ---------------------------------------------------------------------------
// New-application notification — mirrors lib/email/bookingNotifications.ts
// exactly: best-effort, never throws, the application row is already
// committed by the caller before this runs, so a failed/unsent email can
// never fail or roll back the submission itself.
// ---------------------------------------------------------------------------

export interface NewApplicationNotificationInput {
  applicationId: string;
  stageName: string;
  contactEmail: string;
  city?: string;
  country?: string;
  primaryGenre?: string;
}

export async function notifyNewApplication(input: NewApplicationNotificationInput): Promise<void> {
  let ok = false;
  let error: string | undefined;

  try {
    const recipients = await getAdminNotificationRecipients();
    if (recipients.length > 0) {
      const admin = newApplicationAdminEmail(input);
      const result = await sendEmail({ to: recipients, subject: admin.subject, html: admin.html, text: admin.text, replyTo: input.contactEmail });
      ok = result.success;
      error = result.error;
    } else {
      error = "No admin recipients configured.";
    }
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error";
  }

  await logActivity({
    actorAdminUserId: null,
    action: ok ? "application.notified" : "application.notification_failed",
    entityType: "application",
    entityId: input.applicationId,
    summary: ok
      ? `Notification email sent for the new application from ${input.stageName}.`
      : `Notification email failed to send for the new application from ${input.stageName}.`,
    metadata: { error },
  }).catch((err) => console.error("[email] failed to record application notification activity log entry", err));
}
