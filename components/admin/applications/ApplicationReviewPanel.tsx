"use client";

import { useActionState, useState } from "react";
import {
  startReviewAction,
  approveApplicationAction,
  rejectApplicationAction,
  returnToReviewAction,
  type ApplicationActionState,
} from "@/lib/admin/applicationActions";
import { Button } from "@/components/admin/ui/Button";
import { SubmitButton } from "@/components/admin/ui/SubmitButton";
import { ConfirmSubmitButton } from "@/components/admin/ui/ConfirmSubmitButton";
import { Input, Label, FieldError, FieldHint, Textarea } from "@/components/admin/ui/FormField";
import { slugify } from "@/lib/slug";

const initialState: ApplicationActionState = { error: null };

export function ApplicationReviewPanel({
  applicationId,
  status,
  suggestedSlug,
}: {
  applicationId: string;
  status: string;
  suggestedSlug: string;
}) {
  const [startState, startFormAction] = useActionState(startReviewAction, initialState);
  const [approveState, approveFormAction] = useActionState(approveApplicationAction, initialState);
  const [slug, setSlug] = useState(slugify(suggestedSlug));
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);

  const canStartReview = status === "submitted";
  const canApproveOrReject = status === "submitted" || status === "under_review";
  const canReturnToReview = status === "approved" || status === "rejected";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {canStartReview ? (
          <form action={startFormAction}>
            <input type="hidden" name="applicationId" value={applicationId} />
            <SubmitButton variant="secondary" pendingLabel="Starting…">
              Start Review
            </SubmitButton>
          </form>
        ) : null}

        {canApproveOrReject ? (
          <Button type="button" variant="primary" onClick={() => setShowApprove((v) => !v)}>
            Approve
          </Button>
        ) : null}

        {canApproveOrReject ? (
          <Button type="button" variant="danger" onClick={() => setShowReject((v) => !v)}>
            Reject
          </Button>
        ) : null}

        {canReturnToReview ? (
          <form action={returnToReviewAction}>
            <input type="hidden" name="applicationId" value={applicationId} />
            <SubmitButton variant="secondary" pendingLabel="Returning…">
              Return to Review
            </SubmitButton>
          </form>
        ) : null}
      </div>

      {showApprove ? (
        <form action={approveFormAction} className="max-w-sm space-y-2 rounded-md border border-[var(--admin-border)] p-4">
          <Label htmlFor="slug">Artist slug</Label>
          <input type="hidden" name="applicationId" value={applicationId} />
          <Input id="slug" name="slug" value={slug} onChange={(e) => setSlug(slugify(e.target.value))} required />
          <FieldHint>
            The public URL will be wavelength.example/artists/{slug || "…"}. The new artist is created as a draft — it will
            not be publicly visible until you publish it.
          </FieldHint>
          <FieldError>{approveState.error}</FieldError>
          <SubmitButton variant="primary" pendingLabel="Approving…">
            Confirm Approval
          </SubmitButton>
        </form>
      ) : null}

      {showReject ? (
        <RejectForm applicationId={applicationId} onCancel={() => setShowReject(false)} />
      ) : null}

      <FieldError>{startState.error}</FieldError>
    </div>
  );
}

function RejectForm({ applicationId, onCancel }: { applicationId: string; onCancel: () => void }) {
  const [reason, setReason] = useState("");

  return (
    <div className="max-w-sm space-y-2 rounded-md border border-[var(--admin-border)] p-4">
      <Label htmlFor="reason">Rejection reason (optional, internal)</Label>
      <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
      <div className="flex gap-2">
        <ConfirmSubmitButton
          action={rejectApplicationAction}
          confirmTitle="Reject this application?"
          confirmBody="The applicant will not be automatically notified. This can be undone later with Return to Review."
          label="Reject Application"
          pendingLabel="Rejecting…"
          onDone={onCancel}
        >
          <input type="hidden" name="applicationId" value={applicationId} />
          <input type="hidden" name="reason" value={reason} />
        </ConfirmSubmitButton>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
