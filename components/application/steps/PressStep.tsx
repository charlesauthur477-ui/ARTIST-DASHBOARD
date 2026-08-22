import type { ApplicationCollaboration, ApplicationPressQuote, ApplicationTestimonial } from "@/types/application";
import { createEmptyCollaboration, createEmptyPressQuote, createEmptyTestimonial } from "@/lib/applicationDefaults";
import { StepShell, StepSubsection } from "@/components/application/StepShell";
import { TextInput } from "@/components/application/fields/TextInput";
import { TextAreaField } from "@/components/application/fields/TextAreaField";
import { AddButton, RepeatableCard } from "@/components/application/RepeatableList";
import type { StepComponentProps } from "./types";

export function PressStep({ data, update }: StepComponentProps) {
  function updateQuote(id: string, patch: Partial<ApplicationPressQuote>) {
    update("pressQuotes", data.pressQuotes.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }
  function updateCollab(id: string, patch: Partial<ApplicationCollaboration>) {
    update("collaborations", data.collaborations.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }
  function updateTestimonial(id: string, patch: Partial<ApplicationTestimonial>) {
    update("testimonials", data.testimonials.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  return (
    <StepShell
      title="Press / EPK Information"
      description="This information helps us build your electronic press kit for media, promoters, and event organizers."
    >
      <TextAreaField label="Artist Statement" value={data.artistStatement} onChange={(v) => update("artistStatement", v)} rows={4} helpText="In your own words — what your music is about, and why." />

      <StepSubsection title="Press Quotes (optional)">
        {data.pressQuotes.map((quote) => (
          <RepeatableCard key={quote.id} label="quote" onRemove={() => update("pressQuotes", data.pressQuotes.filter((q) => q.id !== quote.id))}>
            <div className="sm:col-span-2">
              <TextAreaField label="Quote" value={quote.quote} onChange={(v) => updateQuote(quote.id, { quote: v })} rows={2} />
            </div>
            <TextInput label="Source" value={quote.source} onChange={(v) => updateQuote(quote.id, { source: v })} placeholder="e.g. Publication or reviewer name" />
          </RepeatableCard>
        ))}
        <AddButton onClick={() => update("pressQuotes", [...data.pressQuotes, createEmptyPressQuote()])}>Add Press Quote</AddButton>
      </StepSubsection>

      <StepSubsection title="Brand Collaborations (optional)">
        {data.collaborations.map((collab) => (
          <RepeatableCard key={collab.id} label={collab.brand || "collaboration"} onRemove={() => update("collaborations", data.collaborations.filter((c) => c.id !== collab.id))}>
            <TextInput label="Brand / Company" value={collab.brand} onChange={(v) => updateCollab(collab.id, { brand: v })} />
            <TextInput label="Collaboration Type" value={collab.type} onChange={(v) => updateCollab(collab.id, { type: v })} />
            <TextInput label="Year" value={collab.year} onChange={(v) => updateCollab(collab.id, { year: v })} />
            <TextInput label="Link" type="url" value={collab.link} onChange={(v) => updateCollab(collab.id, { link: v })} />
            <div className="sm:col-span-2">
              <TextAreaField label="Description" value={collab.description} onChange={(v) => updateCollab(collab.id, { description: v })} rows={2} />
            </div>
          </RepeatableCard>
        ))}
        <AddButton onClick={() => update("collaborations", [...data.collaborations, createEmptyCollaboration()])}>Add Collaboration</AddButton>
      </StepSubsection>

      <StepSubsection title="Testimonials (optional)">
        {data.testimonials.map((t) => (
          <RepeatableCard key={t.id} label={t.clientName || "testimonial"} onRemove={() => update("testimonials", data.testimonials.filter((x) => x.id !== t.id))}>
            <TextInput label="Client Name" value={t.clientName} onChange={(v) => updateTestimonial(t.id, { clientName: v })} />
            <TextInput label="Company" value={t.company} onChange={(v) => updateTestimonial(t.id, { company: v })} />
            <TextInput label="Event" value={t.event} onChange={(v) => updateTestimonial(t.id, { event: v })} />
            <div className="sm:col-span-2">
              <TextAreaField label="Testimonial" value={t.testimonial} onChange={(v) => updateTestimonial(t.id, { testimonial: v })} rows={2} />
            </div>
          </RepeatableCard>
        ))}
        <AddButton onClick={() => update("testimonials", [...data.testimonials, createEmptyTestimonial()])}>Add Testimonial</AddButton>
      </StepSubsection>

      <StepSubsection title="Links">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput label="Press Kit URL" type="url" value={data.pressKitUrl} onChange={(v) => update("pressKitUrl", v)} helpText="If you already have an existing EPK online." />
          <TextInput label="Website URL" type="url" value={data.websiteUrl} onChange={(v) => update("websiteUrl", v)} />
        </div>
      </StepSubsection>
    </StepShell>
  );
}
