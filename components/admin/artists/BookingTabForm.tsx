"use client";

import { useState, useTransition } from "react";
import { updateArtistProfileAction } from "@/lib/admin/artistActions";
import { Input, Label, Textarea, FieldError } from "@/components/admin/ui/FormField";
import { Button } from "@/components/admin/ui/Button";
import type { Artist } from "@/types/artist";

type ContactInformation = Artist["contactInformation"];
type BookingSettings = Artist["bookingSettings"];

export function BookingTabForm({
  artistId,
  initialBooking,
  initialContact,
}: {
  artistId: string;
  initialBooking: BookingSettings;
  initialContact: ContactInformation;
}) {
  const [booking, setBooking] = useState(initialBooking);
  const [contact, setContact] = useState(initialContact);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateArtistProfileAction(artistId, { bookingSettings: booking, contactInformation: contact });
      if (result.error) setError(result.error);
      else setSavedAt(Date.now());
    });
  }

  function setChannel(key: keyof ContactInformation, patch: Partial<ContactInformation[typeof key]>) {
    setContact((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  return (
    <div className="max-w-2xl space-y-6">
      <section>
        <h2 className="mb-3 text-base font-semibold">Booking settings</h2>
        <div className="mb-3">
          <Label>Event types (comma-separated)</Label>
          <Input
            value={booking.eventTypes.join(", ")}
            onChange={(e) => setBooking((b) => ({ ...b, eventTypes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))}
          />
        </div>
        <div className="mb-3">
          <Label>Budget ranges (comma-separated)</Label>
          <Input
            value={booking.budgetRanges.join(", ")}
            onChange={(e) => setBooking((b) => ({ ...b, budgetRanges: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))}
          />
        </div>
        <div>
          <Label>Enquiry note</Label>
          <Textarea value={booking.enquiryNote} onChange={(e) => setBooking((b) => ({ ...b, enquiryNote: e.target.value }))} rows={2} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold">Contact channels</h2>
        {(["bookings", "management", "press", "general"] as const).map((key) => (
          <div key={key} className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Label>{key} label</Label>
              <Input value={contact[key].label} onChange={(e) => setChannel(key, { label: e.target.value })} />
            </div>
            <div>
              <Label>{key} email</Label>
              <Input value={contact[key].email ?? ""} onChange={(e) => setChannel(key, { email: e.target.value })} />
            </div>
            <div>
              <Label>{key} phone</Label>
              <Input value={contact[key].phone ?? ""} onChange={(e) => setChannel(key, { phone: e.target.value })} />
            </div>
          </div>
        ))}
      </section>

      <FieldError>{error}</FieldError>
      <div className="flex items-center gap-3">
        <Button type="button" variant="primary" onClick={save} disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </Button>
        {savedAt ? <span className="text-sm text-[var(--admin-success)]">Saved.</span> : null}
      </div>
    </div>
  );
}
