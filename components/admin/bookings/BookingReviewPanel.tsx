"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateBookingStatusAction } from "@/lib/admin/bookingActions";
import type { BookingStatus } from "@/lib/repositories/bookings";
import { Button } from "@/components/admin/ui/Button";
import { Label, Textarea, FieldError } from "@/components/admin/ui/FormField";

const STATUS_OPTIONS: { value: BookingStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "negotiating", label: "Negotiating" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

export function BookingReviewPanel({ bookingId, status, internalNotes }: { bookingId: string; status: BookingStatus; internalNotes: string }) {
  const [notes, setNotes] = useState(internalNotes);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function changeStatus(next: BookingStatus) {
    setError(null);
    startTransition(async () => {
      const result = await updateBookingStatusAction(bookingId, next, notes);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  function saveNotes() {
    changeStatus(status);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            type="button"
            variant={opt.value === status ? "primary" : "secondary"}
            size="sm"
            disabled={pending}
            onClick={() => changeStatus(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      <div className="max-w-lg space-y-2">
        <Label htmlFor="internalNotes">Internal notes</Label>
        <Textarea id="internalNotes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
        <Button type="button" variant="secondary" size="sm" disabled={pending} onClick={saveNotes}>
          Save Notes
        </Button>
      </div>

      <FieldError>{error}</FieldError>
    </div>
  );
}
