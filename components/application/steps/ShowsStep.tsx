import type { ApplicationShow } from "@/types/application";
import { createEmptyShow } from "@/lib/applicationDefaults";
import { StepShell } from "@/components/application/StepShell";
import { TextInput } from "@/components/application/fields/TextInput";
import { CheckboxField } from "@/components/application/fields/CheckboxField";
import { AddButton, RepeatableCard } from "@/components/application/RepeatableList";
import type { StepComponentProps } from "./types";

export function ShowsStep({ data, update }: StepComponentProps) {
  function updateShow(id: string, patch: Partial<ApplicationShow>) {
    update(
      "shows",
      data.shows.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  }
  function removeShow(id: string) {
    update("shows", data.shows.filter((s) => s.id !== id));
  }

  return (
    <StepShell title="Upcoming Shows" description="Tell us about any performances you have coming up.">
      <CheckboxField
        checked={data.hasNoUpcomingShows}
        onChange={(v) => update("hasNoUpcomingShows", v)}
        label="I currently have no upcoming public shows."
      />

      {!data.hasNoUpcomingShows ? (
        <>
          {data.shows.map((show) => (
            <RepeatableCard key={show.id} label={show.eventName || "show"} onRemove={() => removeShow(show.id)}>
              <TextInput label="Date" type="date" value={show.date} onChange={(v) => updateShow(show.id, { date: v })} />
              <TextInput label="Venue" value={show.venue} onChange={(v) => updateShow(show.id, { venue: v })} />
              <div className="grid grid-cols-2 gap-3">
                <TextInput label="City" value={show.city} onChange={(v) => updateShow(show.id, { city: v })} />
                <TextInput label="Country" value={show.country} onChange={(v) => updateShow(show.id, { country: v })} />
              </div>
              <TextInput label="Event Name" value={show.eventName} onChange={(v) => updateShow(show.id, { eventName: v })} />
              <TextInput label="Event Type" value={show.eventType} onChange={(v) => updateShow(show.id, { eventType: v })} placeholder="e.g. Festival, Club Show" />
              <TextInput label="Ticket URL" type="url" value={show.ticketUrl} onChange={(v) => updateShow(show.id, { ticketUrl: v })} />
              <div className="sm:col-span-2">
                <CheckboxField
                  checked={show.isPublic}
                  onChange={(v) => updateShow(show.id, { isPublic: v })}
                  label="This show can be listed publicly on my website"
                />
              </div>
            </RepeatableCard>
          ))}

          <AddButton onClick={() => update("shows", [...data.shows, createEmptyShow()])}>Add Show</AddButton>
        </>
      ) : null}
    </StepShell>
  );
}
