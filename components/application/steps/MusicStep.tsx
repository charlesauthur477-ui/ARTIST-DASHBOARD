import type { ApplicationRelease } from "@/types/application";
import { RELEASE_TYPES } from "@/types/application";
import { createEmptyRelease } from "@/lib/applicationDefaults";
import { StepShell } from "@/components/application/StepShell";
import { TextInput } from "@/components/application/fields/TextInput";
import { TextAreaField } from "@/components/application/fields/TextAreaField";
import { SelectField } from "@/components/application/fields/SelectField";
import { FileInput } from "@/components/application/fields/FileInput";
import { AddButton, RepeatableCard } from "@/components/application/RepeatableList";
import type { StepComponentProps } from "./types";

const RELEASE_TYPE_LABELS: Record<(typeof RELEASE_TYPES)[number], string> = {
  album: "Album",
  ep: "EP",
  single: "Single",
};

export function MusicStep({ data, update }: StepComponentProps) {
  function updateRelease(id: string, patch: Partial<ApplicationRelease>) {
    update(
      "releases",
      data.releases.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  }
  function removeRelease(id: string) {
    update("releases", data.releases.filter((r) => r.id !== id));
  }

  return (
    <StepShell title="Music" description="Add your albums, EPs, and singles. You can add as many releases as you'd like.">
      {data.releases.map((release) => (
        <RepeatableCard key={release.id} label={release.title || "release"} onRemove={() => removeRelease(release.id)}>
          <SelectField
            label="Release Type"
            value={release.type}
            onChange={(v) => updateRelease(release.id, { type: v as ApplicationRelease["type"] })}
            options={RELEASE_TYPES.map((t) => ({ value: t, label: RELEASE_TYPE_LABELS[t] }))}
          />
          <TextInput label="Release Name" value={release.title} onChange={(v) => updateRelease(release.id, { title: v })} />
          <TextInput
            label="Release Date"
            type="date"
            value={release.releaseDate}
            onChange={(v) => updateRelease(release.id, { releaseDate: v })}
          />
          <div className="sm:col-span-2">
            <FileInput
              label="Cover Artwork"
              asset={release.artwork}
              onChange={(a) => updateRelease(release.id, { artwork: a })}
            />
          </div>
          <div className="sm:col-span-2">
            <TextAreaField
              label="Description"
              value={release.description}
              onChange={(v) => updateRelease(release.id, { description: v })}
              rows={2}
            />
          </div>
          <TextInput label="Spotify URL" type="url" value={release.spotifyUrl} onChange={(v) => updateRelease(release.id, { spotifyUrl: v })} />
          <TextInput label="Apple Music URL" type="url" value={release.appleMusicUrl} onChange={(v) => updateRelease(release.id, { appleMusicUrl: v })} />
          <TextInput label="YouTube URL" type="url" value={release.youtubeUrl} onChange={(v) => updateRelease(release.id, { youtubeUrl: v })} />
          <TextInput label="Other Streaming URL" type="url" value={release.otherUrl} onChange={(v) => updateRelease(release.id, { otherUrl: v })} />
        </RepeatableCard>
      ))}

      <AddButton onClick={() => update("releases", [...data.releases, createEmptyRelease()])}>Add Another Release</AddButton>
    </StepShell>
  );
}
