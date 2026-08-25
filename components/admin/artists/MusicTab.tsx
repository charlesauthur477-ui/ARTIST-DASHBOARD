"use client";

import { replaceReleasesAction } from "@/lib/admin/artistActions";
import { RepeatableListEditor } from "@/components/admin/artists/RepeatableListEditor";
import { AdminImagePicker } from "@/components/admin/media/AdminImagePicker";
import { Input, Label, Select, Textarea } from "@/components/admin/ui/FormField";

export interface ReleaseItem {
  type: "album" | "ep" | "single";
  title: string;
  releaseDate: string;
  coverImageMediaId: string | null;
  coverImageUrl: string | null;
  description: string;
  trackCount: number | null;
  streamingLinks: { spotify?: string; appleMusic?: string; youtube?: string; soundcloud?: string };
}

const emptyItem: ReleaseItem = {
  type: "single",
  title: "",
  releaseDate: "",
  coverImageMediaId: null,
  coverImageUrl: null,
  description: "",
  trackCount: null,
  streamingLinks: {},
};

export function MusicTab({ artistId, items }: { artistId: string; items: ReleaseItem[] }) {
  return (
    <RepeatableListEditor<ReleaseItem>
      items={items}
      emptyItem={emptyItem}
      itemLabel={(item) => item.title || "Untitled release"}
      onSave={async (all) =>
        replaceReleasesAction(
          artistId,
          all.map((item) => ({
            type: item.type,
            title: item.title,
            releaseDate: item.releaseDate,
            coverImageMediaId: item.coverImageMediaId,
            description: item.description,
            trackCount: item.trackCount ?? undefined,
            streamingLinks: item.streamingLinks,
          }))
        )
      }
      renderItem={(item, update) => (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label>Title</Label>
            <Input value={item.title} onChange={(e) => update({ title: e.target.value })} />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={item.type} onChange={(e) => update({ type: e.target.value as ReleaseItem["type"] })}>
              <option value="single">Single</option>
              <option value="ep">EP</option>
              <option value="album">Album</option>
            </Select>
          </div>
          <div>
            <Label>Release date</Label>
            <Input type="date" value={item.releaseDate} onChange={(e) => update({ releaseDate: e.target.value })} />
          </div>
          <div>
            <Label>Spotify URL</Label>
            <Input
              value={item.streamingLinks.spotify ?? ""}
              onChange={(e) => update({ streamingLinks: { ...item.streamingLinks, spotify: e.target.value } })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Description</Label>
            <Textarea value={item.description} onChange={(e) => update({ description: e.target.value })} rows={2} />
          </div>
          <div>
            <AdminImagePicker
              ownerId={artistId}
              role="release_artwork"
              mediaId={item.coverImageMediaId}
              previewUrl={item.coverImageUrl}
              label="Cover artwork"
              onChange={(mediaId, url) => update({ coverImageMediaId: mediaId, coverImageUrl: url })}
            />
          </div>
        </div>
      )}
    />
  );
}
