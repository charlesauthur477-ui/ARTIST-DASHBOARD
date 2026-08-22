import type { ApplicationBandMember } from "@/types/application";
import { createEmptyBandMember } from "@/lib/applicationDefaults";
import { StepShell } from "@/components/application/StepShell";
import { TextInput } from "@/components/application/fields/TextInput";
import { TextAreaField } from "@/components/application/fields/TextAreaField";
import { FileInput } from "@/components/application/fields/FileInput";
import { CheckboxField } from "@/components/application/fields/CheckboxField";
import { AddButton, RepeatableCard } from "@/components/application/RepeatableList";
import type { StepComponentProps } from "./types";

export function BandStep({ data, update, applicationId }: StepComponentProps) {
  function updateMember(id: string, patch: Partial<ApplicationBandMember>) {
    update(
      "bandMembers",
      data.bandMembers.map((m) => (m.id === id ? { ...m, ...patch } : m))
    );
  }
  function removeMember(id: string) {
    update("bandMembers", data.bandMembers.filter((m) => m.id !== id));
  }

  return (
    <StepShell title="Band Members" description="If you perform with a band, tell us who's in it.">
      <CheckboxField
        checked={data.isSoloNoBand}
        onChange={(v) => update("isSoloNoBand", v)}
        label="This is a solo performance / I don't currently have a band."
      />

      {!data.isSoloNoBand ? (
        <>
          {data.bandMembers.map((member) => (
            <RepeatableCard key={member.id} label={member.name || "band member"} onRemove={() => removeMember(member.id)}>
              <TextInput label="Name" value={member.name} onChange={(v) => updateMember(member.id, { name: v })} />
              <TextInput label="Role / Instrument" value={member.role} onChange={(v) => updateMember(member.id, { role: v })} placeholder="e.g. Guitar, Drums" />
              <div className="sm:col-span-2">
                <TextAreaField label="Short Bio" value={member.bio} onChange={(v) => updateMember(member.id, { bio: v })} rows={2} />
              </div>
              <TextInput label="Instagram" type="url" value={member.instagram} onChange={(v) => updateMember(member.id, { instagram: v })} />
              <div className="sm:col-span-2">
                <FileInput
                  label="Photo"
                  asset={member.photo}
                  onChange={(a) => updateMember(member.id, { photo: a })}
                  applicationId={applicationId}
                  role="band_member_photo"
                />
              </div>
            </RepeatableCard>
          ))}

          <AddButton onClick={() => update("bandMembers", [...data.bandMembers, createEmptyBandMember()])}>Add Band Member</AddButton>
        </>
      ) : null}
    </StepShell>
  );
}
