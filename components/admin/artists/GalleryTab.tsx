"use client";

import { replaceGalleryAction } from "@/lib/admin/artistActions";
import { RepeatableListEditor } from "@/components/admin/artists/RepeatableListEditor";
import { AdminImagePicker } from "@/components/admin/media/AdminImagePicker";
import { Input, Label, Select } from "@/components/admin/ui/FormField";

export interface GalleryItem {
  mediaId: string | null;
  url: string | null;
  alt: string;
  category: "live" | "editorial" | "studio" | "backstage" | "events";
}

const emptyItem: GalleryItem = { mediaId: null, url: null, alt: "", category: "live" };

export function GalleryTab({ artistId, items }: { artistId: string; items: GalleryItem[] }) {
  return (
    <div>
      <h2 className="mb-3 text-base font-semibold">Gallery</h2>
      <RepeatableListEditor<GalleryItem>
        items={items}
        emptyItem={emptyItem}
        itemLabel={(item) => item.alt || "Untitled photo"}
        onSave={async (all) =>
          replaceGalleryAction(
            artistId,
            all.filter((item) => item.mediaId).map((item) => ({ mediaId: item.mediaId as string, alt: item.alt, category: item.category }))
          )
        }
        renderItem={(item, update) => (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label>Alt text</Label>
              <Input value={item.alt} onChange={(e) => update({ alt: e.target.value })} />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={item.category} onChange={(e) => update({ category: e.target.value as GalleryItem["category"] })}>
                <option value="live">Live</option>
                <option value="editorial">Editorial</option>
                <option value="studio">Studio</option>
                <option value="backstage">Backstage</option>
                <option value="events">Events</option>
              </Select>
            </div>
            <div>
              <AdminImagePicker
                ownerId={artistId}
                role="gallery_photo"
                mediaId={item.mediaId}
                previewUrl={item.url}
                label="Photo"
                onChange={(mediaId, url) => update({ mediaId, url })}
              />
            </div>
          </div>
        )}
      />
    </div>
  );
}
