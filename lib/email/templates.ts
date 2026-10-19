import { siteUrl } from "@/lib/siteUrl";

// ---------------------------------------------------------------------------
// Plain, dependency-free email templates (no React Email / MJML) — small
// hand-written HTML + a plain-text fallback for every message, matching the
// project's "no new dependency unless necessary" convention.
//
// STRICT DATA-EXPOSURE RULE, enforced by construction: every template
// function's parameter type only includes the fields that recipient is
// allowed to see. Admin templates take the full booking row; artist/public
// templates take a narrower shape that has no internalNotes/reviewedBy/
// budgetRange field at all, so it is impossible to accidentally leak an
// admin-only field into an artist- or enquirer-facing email — there is no
// field to reach for.
// ---------------------------------------------------------------------------

// Every value interpolated into an email's HTML below ultimately traces
// back to public-form/CMS input (client name, message, event type, etc.)
// with no HTML sanitization upstream — escape it here, at the one place
// untrusted text meets an HTML string, rather than trusting every call site
// to remember to. (`title`/`label` arguments are always literal strings
// this file writes itself, never data — those are left unescaped.)
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wrap(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f3;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e7e5e4;">
            <tr>
              <td style="background:#0b0a09;padding:20px 24px;">
                <span style="color:#f5f5f4;font-size:16px;font-weight:600;">Wavelength</span>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;color:#1c1917;font-size:14px;line-height:1.6;">
                <h1 style="font-size:18px;margin:0 0 16px;color:#1c1917;">${title}</h1>
                ${bodyHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function row(label: string, value: string): string {
  if (!value) return "";
  return `<p style="margin:0 0 8px;"><strong style="color:#57534e;">${label}:</strong> ${escapeHtml(value)}</p>`;
}

// --- New booking enquiry ----------------------------------------------------

export interface AdminBookingNoticeData {
  bookingId: string;
  artistName: string;
  clientName: string;
  company?: string;
  email: string;
  phone: string;
  eventType: string;
  eventDate: string;
  location: string;
  expectedAudience?: string;
  performanceFormat: string;
  budgetRange?: string;
  message?: string;
}

export function newBookingAdminEmail(data: AdminBookingNoticeData) {
  const reviewUrl = siteUrl(`/admin/bookings/${data.bookingId}`);
  const subject = `New booking enquiry — ${data.artistName} (${data.eventDate})`;
  const html = wrap(
    "New booking enquiry",
    `
    ${row("Artist", data.artistName)}
    ${row("Client", data.clientName)}
    ${row("Company/Organization", data.company || "")}
    ${row("Email", data.email)}
    ${row("Phone", data.phone)}
    ${row("Event type", data.eventType)}
    ${row("Event date", data.eventDate)}
    ${row("Location", data.location)}
    ${row("Expected audience", data.expectedAudience || "")}
    ${row("Performance format", data.performanceFormat)}
    ${row("Budget range", data.budgetRange || "")}
    ${data.message ? `<p style="margin:16px 0 0;"><strong style="color:#57534e;">Message:</strong><br/>${escapeHtml(data.message)}</p>` : ""}
    <p style="margin:20px 0 0;"><a href="${reviewUrl}" style="color:#2563eb;">Review this booking →</a></p>
    `
  );
  const text = [
    `New booking enquiry for ${data.artistName}`,
    `Client: ${data.clientName}`,
    data.company ? `Company: ${data.company}` : "",
    `Email: ${data.email}`,
    `Phone: ${data.phone}`,
    `Event type: ${data.eventType}`,
    `Event date: ${data.eventDate}`,
    `Location: ${data.location}`,
    data.expectedAudience ? `Expected audience: ${data.expectedAudience}` : "",
    `Performance format: ${data.performanceFormat}`,
    data.budgetRange ? `Budget range: ${data.budgetRange}` : "",
    data.message ? `Message: ${data.message}` : "",
    `Review: ${reviewUrl}`,
  ]
    .filter(Boolean)
    .join("\n");
  return { subject, html, text };
}

export interface EnquirerAckData {
  firstName: string;
  artistName: string;
  eventDate: string;
  referenceId: string;
}

export function bookingReceivedEnquirerEmail(data: EnquirerAckData) {
  const subject = `We received your booking enquiry for ${data.artistName}`;
  const html = wrap(
    "Enquiry received",
    `<p>Hi ${escapeHtml(data.firstName)},</p>
     <p>Thanks for your interest in booking <strong>${escapeHtml(data.artistName)}</strong> for ${escapeHtml(data.eventDate)}. Our team typically responds within 1–2 business days.</p>
     <p style="color:#78716c;font-size:12px;margin-top:20px;">Reference: ${escapeHtml(data.referenceId)}</p>`
  );
  const text = `Hi ${data.firstName},\n\nThanks for your interest in booking ${data.artistName} for ${data.eventDate}. Our team typically responds within 1–2 business days.\n\nReference: ${data.referenceId}`;
  return { subject, html, text };
}

// --- New artist application --------------------------------------------------

export interface AdminApplicationNoticeData {
  applicationId: string;
  stageName: string;
  contactEmail: string;
  city?: string;
  country?: string;
  primaryGenre?: string;
}

export function newApplicationAdminEmail(data: AdminApplicationNoticeData) {
  const reviewUrl = siteUrl(`/admin/applications/${data.applicationId}`);
  const subject = `New artist application — ${data.stageName}`;
  const html = wrap(
    "New artist application",
    `
    ${row("Stage name", data.stageName)}
    ${row("Contact email", data.contactEmail)}
    ${row("Location", [data.city, data.country].filter(Boolean).join(", "))}
    ${row("Genre", data.primaryGenre || "")}
    <p style="margin:20px 0 0;"><a href="${reviewUrl}" style="color:#2563eb;">Review this application →</a></p>
    `
  );
  const text = [
    `New artist application: ${data.stageName}`,
    `Contact email: ${data.contactEmail}`,
    [data.city, data.country].filter(Boolean).length ? `Location: ${[data.city, data.country].filter(Boolean).join(", ")}` : "",
    data.primaryGenre ? `Genre: ${data.primaryGenre}` : "",
    `Review: ${reviewUrl}`,
  ]
    .filter(Boolean)
    .join("\n");
  return { subject, html, text };
}

// --- Status change: confirmed -----------------------------------------------

export interface BookingConfirmedEnquirerData {
  firstName: string;
  artistName: string;
  eventDate: string;
  location: string;
  eventType: string;
  contactLabel: string;
  contactEmail?: string;
  contactPhone?: string;
}

export function bookingConfirmedEnquirerEmail(data: BookingConfirmedEnquirerData) {
  const subject = `Confirmed: ${data.artistName} for ${data.eventDate}`;
  const contactLine =
    data.contactEmail || data.contactPhone
      ? row(data.contactLabel, [data.contactEmail, data.contactPhone].filter(Boolean).join(" · "))
      : "";
  const html = wrap(
    "Your booking is confirmed",
    `<p>Hi ${escapeHtml(data.firstName)},</p>
     <p>Good news — <strong>${escapeHtml(data.artistName)}</strong> is confirmed for your event.</p>
     ${row("Event date", data.eventDate)}
     ${row("Location", data.location)}
     ${row("Event type", data.eventType)}
     ${contactLine}
     <p style="margin-top:16px;">If anything above needs to change, please reach out using the contact details above.</p>`
  );
  const text = [
    `Hi ${data.firstName},`,
    ``,
    `Good news — ${data.artistName} is confirmed for your event.`,
    `Event date: ${data.eventDate}`,
    `Location: ${data.location}`,
    `Event type: ${data.eventType}`,
    data.contactEmail || data.contactPhone
      ? `${data.contactLabel}: ${[data.contactEmail, data.contactPhone].filter(Boolean).join(" / ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
  return { subject, html, text };
}

export interface BookingConfirmedArtistData {
  artistFirstName?: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  eventDate: string;
  location: string;
  eventType: string;
  bookingId: string;
}

/**
 * Sent to the ARTIST's own portal login email. Deliberately excludes
 * internalNotes and reviewedBy (admin-only fields) — only what's already
 * visible to the artist on /artist/bookings/[id] is included here.
 */
export function bookingConfirmedArtistEmail(data: BookingConfirmedArtistData) {
  const bookingUrl = siteUrl(`/artist/bookings/${data.bookingId}`);
  const subject = `New confirmed booking — ${data.eventDate}`;
  const html = wrap(
    "You have a new confirmed booking",
    `<p>Hi${data.artistFirstName ? ` ${escapeHtml(data.artistFirstName)}` : ""},</p>
     <p>A booking has just been confirmed on your calendar.</p>
     ${row("Client", data.clientName)}
     ${row("Contact", [data.clientEmail, data.clientPhone].filter(Boolean).join(" · "))}
     ${row("Event date", data.eventDate)}
     ${row("Location", data.location)}
     ${row("Event type", data.eventType)}
     <p style="margin-top:16px;"><a href="${bookingUrl}" style="color:#2563eb;">View in your Artist Portal →</a></p>`
  );
  const text = [
    `A booking has just been confirmed on your calendar.`,
    `Client: ${data.clientName}`,
    `Contact: ${[data.clientEmail, data.clientPhone].filter(Boolean).join(" / ")}`,
    `Event date: ${data.eventDate}`,
    `Location: ${data.location}`,
    `Event type: ${data.eventType}`,
    `View: ${bookingUrl}`,
  ].join("\n");
  return { subject, html, text };
}

// --- Status change: rejected / cancelled ------------------------------------

export interface BookingDeclinedEnquirerData {
  firstName: string;
  artistName: string;
  eventDate: string;
  status: "rejected" | "cancelled";
}

export function bookingDeclinedEnquirerEmail(data: BookingDeclinedEnquirerData) {
  const verb = data.status === "cancelled" ? "has been cancelled" : "could not be confirmed";
  const subject = `Update on your ${data.artistName} booking enquiry`;
  const html = wrap(
    "Booking update",
    `<p>Hi ${escapeHtml(data.firstName)},</p>
     <p>Unfortunately, your enquiry for <strong>${escapeHtml(data.artistName)}</strong> on ${escapeHtml(data.eventDate)} ${verb}. If you'd like to discuss alternative dates or other artists, feel free to reach back out.</p>`
  );
  const text = `Hi ${data.firstName},\n\nUnfortunately, your enquiry for ${data.artistName} on ${data.eventDate} ${verb}. If you'd like to discuss alternative dates or other artists, feel free to reach back out.`;
  return { subject, html, text };
}

// --- Portal access created/reset (artist portal) ----------------------------

/**
 * Sent when an admin creates or resets an artist's portal login WITH a
 * password (see lib/admin/artistUserActions.ts). Previously the admin had
 * to manually copy the generated password off screen and relay it to the
 * artist themselves (PortalAccessCard.tsx's own hint text says exactly
 * that) — this closes that loop automatically. Only ever called with a
 * password that was just set, so there's always something real to tell the
 * artist; never called on an email-only update that left the password
 * unchanged.
 */
export function artistPortalAccessEmail(data: { email: string; password: string; isNewAccount: boolean }) {
  const loginUrl = siteUrl("/artist/login");
  const subject = data.isNewAccount ? "Your Wavelength Artist Portal account" : "Your Wavelength Artist Portal password was reset";
  const html = wrap(
    data.isNewAccount ? "Welcome to your Artist Portal" : "Your password was reset",
    `<p>${data.isNewAccount ? "An account has been created for you on the Wavelength Artist Portal." : "Your Artist Portal password has been reset."} You can sign in with:</p>
     ${row("Email", data.email)}
     ${row("Temporary password", data.password)}
     <p style="margin:20px 0;"><a href="${loginUrl}" style="display:inline-block;background:#0b0a09;color:#f5f5f4;padding:10px 18px;border-radius:6px;text-decoration:none;">Sign in →</a></p>
     <p style="color:#78716c;font-size:12px;">For your security, we recommend changing this password after you sign in (Account → Change password).</p>`
  );
  const text = `${data.isNewAccount ? "An account has been created for you on the Wavelength Artist Portal." : "Your Artist Portal password has been reset."}\n\nEmail: ${data.email}\nTemporary password: ${data.password}\n\nSign in: ${loginUrl}\n\nFor your security, we recommend changing this password after you sign in (Account → Change password).`;
  return { subject, html, text };
}

// --- Password reset (artist portal) -----------------------------------------

export function artistPasswordResetEmail(resetUrl: string) {
  const subject = "Reset your Wavelength Artist Portal password";
  const html = wrap(
    "Reset your password",
    `<p>We received a request to reset your Artist Portal password. This link expires in 1 hour and can only be used once.</p>
     <p style="margin:20px 0;"><a href="${resetUrl}" style="display:inline-block;background:#0b0a09;color:#f5f5f4;padding:10px 18px;border-radius:6px;text-decoration:none;">Reset password</a></p>
     <p style="color:#78716c;font-size:12px;">If you didn't request this, you can safely ignore this email — your password will not be changed.</p>`
  );
  const text = `We received a request to reset your Artist Portal password. This link expires in 1 hour and can only be used once.\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email — your password will not be changed.`;
  return { subject, html, text };
}
