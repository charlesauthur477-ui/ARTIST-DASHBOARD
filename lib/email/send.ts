import "server-only";

// ---------------------------------------------------------------------------
// Outbound email — 3-day sprint, item 2.
//
// Deliberately the simplest possible integration: a single fetch() call to
// Resend's REST API (https://resend.com), no SDK dependency, matching this
// project's existing convention of hand-rolling a narrow HTTP surface
// rather than adding a package for it (see the earlier Google Calendar REST
// client, now removed, for the same pattern).
//
// FAILURE-TOLERANT BY DESIGN: sendEmail() never throws. Every caller in
// lib/email/bookingNotifications.ts and the password-reset flow already
// awaits it and treats the result as "best effort" — a booking or a
// password-reset token is fully committed to the database before any email
// is attempted, and a failed/skipped send never undoes that. Missing
// configuration (no RESEND_API_KEY) is treated the same as a delivery
// failure: logged, not thrown, so local/dev environments without email
// configured keep working exactly as before this feature existed.
// ---------------------------------------------------------------------------

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  error?: string;
}

function getFromAddress(): string {
  return process.env.EMAIL_FROM || "Wavelength <onboarding@resend.dev>";
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY not set — skipping "${input.subject}" to ${JSON.stringify(input.to)}`);
    return { success: false, error: "Email is not configured (RESEND_API_KEY unset)." };
  }

  const recipients = Array.isArray(input.to) ? input.to.filter(Boolean) : [input.to].filter(Boolean);
  if (recipients.length === 0) {
    return { success: false, error: "No recipient email address." };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getFromAddress(),
        to: recipients,
        subject: input.subject,
        html: input.html,
        text: input.text,
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[email] Resend returned ${res.status} for "${input.subject}":`, body.slice(0, 500));
      return { success: false, error: `Email provider returned ${res.status}.` };
    }

    return { success: true };
  } catch (err) {
    console.error(`[email] send threw for "${input.subject}"`, err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown email error." };
  }
}
