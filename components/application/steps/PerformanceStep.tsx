import type { ApplicationPerformanceFormat } from "@/types/application";
import { StepShell, StepSubsection } from "@/components/application/StepShell";
import { CheckboxField } from "@/components/application/fields/CheckboxField";
import { TextAreaField } from "@/components/application/fields/TextAreaField";
import { TextInput } from "@/components/application/fields/TextInput";
import type { StepComponentProps } from "./types";

export function PerformanceStep({ data, update }: StepComponentProps) {
  function updateFormat(id: string, patch: Partial<ApplicationPerformanceFormat>) {
    update(
      "performanceFormats",
      data.performanceFormats.map((f) => (f.id === id ? { ...f, ...patch } : f))
    );
  }

  return (
    <StepShell title="Performance Formats" description="What performance formats do you offer? Select all that apply.">
      <div className="space-y-4">
        {data.performanceFormats.map((format) => (
          <div key={format.id} className="rounded-lg border border-border-subtle p-4 sm:p-5">
            <CheckboxField
              checked={format.selected}
              onChange={(v) => updateFormat(format.id, { selected: v })}
              label={<span className="font-medium text-foreground">{format.label}</span>}
            />
            {format.selected ? (
              <div className="mt-3 ml-8">
                <TextAreaField
                  label="Short description"
                  value={format.description}
                  onChange={(v) => updateFormat(format.id, { description: v })}
                  rows={2}
                  placeholder={
                    format.id === "full-band"
                      ? 'e.g. "5-piece live band suitable for festivals, weddings and corporate events."'
                      : undefined
                  }
                />
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <TextInput
        label="Starting budget/range (optional — management use only)"
        value={data.budgetRange}
        onChange={(v) => update("budgetRange", v)}
        placeholder="e.g. $2,000 – $5,000"
        helpText="This is for our internal planning only and will not necessarily be displayed publicly."
      />

      <StepSubsection title="Technical / Performance Info (optional)">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput label="Typical Set Duration" value={data.typicalSetDuration} onChange={(v) => update("typicalSetDuration", v)} placeholder="e.g. 60–90 minutes" />
          <TextInput label="Number of Sets" value={data.numberOfSets} onChange={(v) => update("numberOfSets", v)} placeholder="e.g. 2" />
        </div>
        <TextAreaField label="Technical Requirements" value={data.technicalRequirements} onChange={(v) => update("technicalRequirements", v)} rows={3} />
        <TextAreaField label="Stage Requirements" value={data.stageRequirements} onChange={(v) => update("stageRequirements", v)} rows={2} />
        <TextAreaField label="Hospitality Notes" value={data.hospitalityNotes} onChange={(v) => update("hospitalityNotes", v)} rows={2} />
      </StepSubsection>
    </StepShell>
  );
}
