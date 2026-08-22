import { EVENT_TYPE_OPTIONS } from "@/types/application";
import { StepShell, StepSubsection } from "@/components/application/StepShell";
import { TextInput } from "@/components/application/fields/TextInput";
import { TextAreaField } from "@/components/application/fields/TextAreaField";
import { CheckboxField } from "@/components/application/fields/CheckboxField";
import type { StepComponentProps } from "./types";

export function BookingStep({ data, update, errors }: StepComponentProps) {
  function toggleEventType(type: string) {
    const set = new Set(data.availableEventTypes);
    if (set.has(type)) set.delete(type);
    else set.add(type);
    update("availableEventTypes", Array.from(set));
  }

  return (
    <StepShell title="Booking Information" description="How should clients and our booking team reach you?">
      <TextInput
        label="Preferred Contact Email"
        required
        type="email"
        value={data.preferredContactEmail}
        onChange={(v) => update("preferredContactEmail", v)}
        error={errors.preferredContactEmail}
      />

      <StepSubsection title="Booking Contact">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput label="Booking Contact Name" value={data.bookingContactName} onChange={(v) => update("bookingContactName", v)} />
          <TextInput label="Booking Contact Email" type="email" value={data.bookingContactEmail} onChange={(v) => update("bookingContactEmail", v)} />
          <TextInput label="Booking Phone" type="tel" value={data.bookingPhone} onChange={(v) => update("bookingPhone", v)} />
        </div>
      </StepSubsection>

      <StepSubsection title="Management Contact">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput label="Management Email" type="email" value={data.managementEmail} onChange={(v) => update("managementEmail", v)} />
          <TextInput label="Management Phone" type="tel" value={data.managementPhone} onChange={(v) => update("managementPhone", v)} />
        </div>
      </StepSubsection>

      <StepSubsection title="Available For">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
          {EVENT_TYPE_OPTIONS.map((type) => (
            <CheckboxField
              key={type}
              checked={data.availableEventTypes.includes(type)}
              onChange={() => toggleEventType(type)}
              label={type}
            />
          ))}
        </div>
      </StepSubsection>

      <StepSubsection title="Travel">
        <CheckboxField checked={data.domesticTravel} onChange={(v) => update("domesticTravel", v)} label="Available for domestic travel" />
        <CheckboxField checked={data.internationalTravel} onChange={(v) => update("internationalTravel", v)} label="Available for international travel" />
      </StepSubsection>

      <TextAreaField label="Additional Booking Notes" value={data.bookingNotes} onChange={(v) => update("bookingNotes", v)} rows={3} />
    </StepShell>
  );
}
