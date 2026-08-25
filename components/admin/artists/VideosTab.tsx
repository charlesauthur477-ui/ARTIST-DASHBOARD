"use client";

import { replaceVideosAction } from "@/lib/admin/artistActions";
import { RepeatableListEditor } from "@/components/admin/artists/RepeatableListEditor";
import { AdminImagePicker } from "@/components/admin/media/AdminImagePicker";
import { Input, Label, Select, Textarea } from "@/components/admin/ui/FormField";

export interface VideoItem {
  title: string;
  description: string;
  platform: "youtube" | "vimeo" | "local";
  videoId: string;
  posterImageMediaId: string | null;
  posterImageUrl: string | null;
  featured: boolean;
}

const emptyItem: VideoItem = {
  title: "",
  description: "",
  platform: "youtube",
  videoId: "",
  posterImageMediaId: null,
  posterImageUrl: null,
  featured: false,
};

export function VideosTab({ artistId, items }: { artistId: string; items: VideoItem[] }) {
  return (
    <RepeatableListEditor<VideoItem>
      items={items}
      emptyItem={emptyItem}
      itemLabel={(item) => item.title || "Untitled video"}
      onSave={async (all) =>
        replaceVideosAction(
          artistId,
          all.map((item) => ({
            title: item.title,
            description: item.description,
            platform: item.platform,
            videoId: item.videoId,
            posterImageMediaId: item.posterImageMediaId,
            featured: item.featured,
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
            <Label>Platform</Label>
            <Select value={item.platform} onChange={(e) => update({ platform: e.target.value as VideoItem["platform"] })}>
              <option value="youtube">YouTube</option>
              <option value="vimeo">Vimeo</option>
              <option value="local">Local file</option>
            </Select>
          </div>
          <div>
            <Label>Video ID / URL</Label>
            <Input value={item.videoId} onChange={(e) => update({ videoId: e.target.value })} />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input id={`featured-${item.title}`} type="checkbox" checked={item.featured} onChange={(e) => update({ featured: e.target.checked })} />
            <Label htmlFor={`featured-${item.title}`} className="mb-0">
              Featured
            </Label>
          </div>
          <div className="sm:col-span-2">
            <Label>Description</Label>
            <Textarea value={item.description} onChange={(e) => update({ description: e.target.value })} rows={2} />
          </div>
          <div>
            <AdminImagePicker
              ownerId={artistId}
              role="gallery_photo"
              mediaId={item.posterImageMediaId}
              previewUrl={item.posterImageUrl}
              label="Poster image"
              onChange={(mediaId, url) => update({ posterImageMediaId: mediaId, posterImageUrl: url })}
            />
          </div>
        </div>
      )}
    />
  );
}
