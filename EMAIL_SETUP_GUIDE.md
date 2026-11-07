# Wavelength Artist Management Platform – Production Email Setup Guide

This guide details how to configure production email sending via **Resend** for the Wavelength Artist Management Platform, ensuring deliverability and inbox placement.

---

## 1. Overview of Email Flows

The platform sends transactional notifications across several key user journeys:

1. **New Booking Enquiry**:
   - Sent to admins (`ADMIN_NOTIFICATION_EMAIL` or active admin users with role `super_admin`/`manager`).
   - Acknowledgment confirmation sent to the client/enquirer.
2. **Booking Status Updates**:
   - **Confirmed**: Confirmation sent to client with artist contact details; notification sent to the artist's portal email.
   - **Declined / Cancelled**: Notice sent to client.
3. **Artist Applications**:
   - Notification sent to admins when a new artist application is submitted.
4. **Artist Portal Access & Password Resets**:
   - Welcome/temporary password email sent when admin provisions portal access.
   - 1-hour secure password reset link sent when requested by an artist.

All email operations are asynchronous and failure-tolerant: missing API keys or provider errors are logged to the `activity_log` table and will never abort database transactions.

---

## 2. Setting Up Resend

### Step 1: Create a Resend Account
1. Visit [https://resend.com](https://resend.com) and create an account.
2. Navigate to **API Keys** in the dashboard and create an API Key with **Full access** (or sending permissions).
3. Copy the key (starts with `re_...`).

### Step 2: Add and Verify Your Custom Domain
1. In the Resend dashboard, navigate to **Domains** -> **Add Domain**.
2. Enter your domain (e.g. `wavelength.com` or `mail.wavelength.com`).
3. Resend provides 3 DNS records to configure with your DNS provider (e.g. Cloudflare, GoDaddy, Route53, Namecheap):
   - **DKIM (DomainKeys Identified Mail)**: TXT record with selector `resend._domainkey` containing the public key.
   - **SPF (Sender Policy Framework)**: MX / TXT record pointing to Resend sending servers (`feedback-smtp.resend.com`).
   - **DMARC (Domain-based Message Authentication)**: TXT record at `_dmarc.yourdomain.com` with value:
     ```txt
     v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
     ```
4. Click **Verify DNS Records** in Resend. Once verified, the status changes to `Verified`.

---

## 3. Environment Variables Configuration

Set these variables in your deployment environment (Vercel Project Settings -> Environment Variables) and locally in `.env.local`:

```bash
# 1. Resend API Key (Required for sending emails)
RESEND_API_KEY="re_1234567890abcdef..."

# 2. Sender Address (Must use your verified Resend domain in production)
# Format: "Name <user@yourdomain.com>"
EMAIL_FROM="Wavelength Bookings <bookings@yourdomain.com>"

# 3. Admin Notification Inbox (Optional fallback)
# Comma-separated email addresses to receive booking and application alerts.
# If unset, notifications default to active super_admin and manager users in Neon DB.
ADMIN_NOTIFICATION_EMAIL="charlesauthur477@gmail.com,admin@yourdomain.com"
```

> [!NOTE]
> During development or before domain verification, `EMAIL_FROM` can use the default test sender `Wavelength <onboarding@resend.dev>`, but Resend restricts sending from `@resend.dev` only to the email address registered on your Resend account. For sending to any client or artist, a verified domain is required.

---

## 4. Deliverability Checklist

- [ ] **Custom Domain Verified**: Domain is marked as `Verified` in Resend dashboard.
- [ ] **DKIM Passed**: TXT `resend._domainkey` matches provider records.
- [ ] **SPF Configured**: Includes Resend sending servers.
- [ ] **DMARC Configured**: `p=none` or `p=quarantine` configured.
- [ ] **`EMAIL_FROM` Matches Domain**: The sender address domain exactly matches the verified domain in Resend.
- [ ] **Activity Log Monitoring**: Check `/admin/activity` to ensure `booking.notified` entries appear without `booking.notification_failed`.
