"use client";

import { publishArtistAction, unpublishArtistAction, archiveArtistAction } from "@/lib/admin/artistActions";
import { ConfirmSubmitButton } from "@/components/admin/ui/ConfirmSubmitButton";
import { SubmitButton } from "@/components/admin/ui/SubmitButton";
import { ArtistStatusBadge } from "@/components/admin/ui/Badge";

export interface PublishCheck {
  label: string;
  ok: boolean;
}

export function PublishingTab({
  artistId,
  status,
  checks,
  publishedAt,
}: {
  artistId: string;
  status: string;
  checks: PublishCheck[];
  publishedAt: string | null;
}) {
  const allOk = checks.every((c) => c.ok);

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <p className="text-sm text-[var(--admin-muted)]">Current status</p>
        <div className="mt-1">
          <ArtistStatusBadge status={status} />
        </div>
        {publishedAt ? <p className="mt-1 text-sm text-[var(--admin-muted)]">First published {new Date(publishedAt).toLocaleString()}</p> : null}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Required for publishing</p>
        <ul className="space-y-1 text-sm">
          {checks.map((c) => (
            <li key={c.label} className={c.ok ? "text-[var(--admin-success)]" : "text-[var(--admin-danger)]"}>
              {c.ok ? "✓" : "✗"} {c.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-2">
        {status !== "active" ? (
          <form action={publishArtistAction}>
            <input type="hidden" name="artistId" value={artistId} />
            <SubmitButton variant="primary" disabled={!allOk} pendingLabel="Publishing…">
              Publish
            </SubmitButton>
          </form>
        ) : null}

        {status === "active" ? (
          <ConfirmSubmitButton
            action={unpublishArtistAction}
            confirmTitle="Unpublish this artist?"
            confirmBody="Their public page will immediately stop being served. You can publish again later."
            label="Unpublish"
            variant="danger"
          >
            <input type="hidden" name="artistId" value={artistId} />
          </ConfirmSubmitButton>
        ) : null}

        {status !== "archived" ? (
          <ConfirmSubmitButton
            action={archiveArtistAction}
            confirmTitle="Archive this artist?"
            confirmBody="This hides them from the public site and most admin views. This is not a permanent delete — the record is kept."
            label="Archive"
            variant="danger"
          >
            <input type="hidden" name="artistId" value={artistId} />
          </ConfirmSubmitButton>
        ) : null}
      </div>

      {!allOk && status !== "active" ? (
        <p className="text-sm text-[var(--admin-muted)]">Complete the required fields above (Profile / Photos / Booking tabs) before publishing.</p>
      ) : null}
    </div>
  );
}
