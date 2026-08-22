import type { ApplicationVideo } from "@/types/application";
import { createEmptyVideo } from "@/lib/applicationDefaults";
import { StepShell } from "@/components/application/StepShell";
import { TextInput } from "@/components/application/fields/TextInput";
import { TextAreaField } from "@/components/application/fields/TextAreaField";
import { AddButton, RepeatableCard } from "@/components/application/RepeatableList";
import type { StepComponentProps } from "./types";

export function VideosStep({ data, update }: StepComponentProps) {
  function updateVideo(id: string, patch: Partial<ApplicationVideo>) {
    update(
      "videos",
      data.videos.map((v) => (v.id === id ? { ...v, ...patch } : v))
    );
  }
  function removeVideo(id: string) {
    update("videos", data.videos.filter((v) => v.id !== id));
  }

  return (
    <StepShell title="Videos" description="Share links to your live performances, music videos, or behind-the-scenes footage.">
      {data.videos.map((video) => (
        <RepeatableCard key={video.id} label={video.title || "video"} onRemove={() => removeVideo(video.id)}>
          <TextInput label="Title" value={video.title} onChange={(v) => updateVideo(video.id, { title: v })} />
          <TextInput
            label="URL"
            type="url"
            value={video.url}
            onChange={(v) => updateVideo(video.id, { url: v })}
            placeholder="YouTube, Vimeo, or other video link"
          />
          <div className="sm:col-span-2">
            <TextAreaField label="Description" value={video.description} onChange={(v) => updateVideo(video.id, { description: v })} rows={2} />
          </div>
        </RepeatableCard>
      ))}

      <AddButton onClick={() => update("videos", [...data.videos, createEmptyVideo()])}>Add Another Video</AddButton>
    </StepShell>
  );
}
