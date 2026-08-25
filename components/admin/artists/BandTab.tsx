"use client";

import { replaceBandMembersAction } from "@/lib/admin/artistActions";
import { RepeatableListEditor } from "@/components/admin/artists/RepeatableListEditor";
import { AdminImagePicker } from "@/components/admin/media/AdminImagePicker";
import { Input, Label, Textarea } from "@/components/admin/ui/FormField";

export interface BandMemberItem {
  name: string;
  role: string;
  bio: string;
  instagram: string;
  photoMediaId: string | null;
  photoUrl: string | null;
}

const emptyItem: BandMemberItem = { name: "", role: "", bio: "", instagram: "", photoMediaId: null, photoUrl: null };

export function BandTab({ artistId, items }: { artistId: string; items: BandMemberItem[] }) {
  return (
    <RepeatableListEditor<BandMemberItem>
      items={items}
      emptyItem={emptyItem}
      itemLabel={(item) => item.name || "Untitled member"}
      onSave={async (all) =>
        replaceBandMembersAction(
          artistId,
          all.map((item) => ({
            name: item.name,
            role: item.role,
            bio: item.bio,
            instagram: item.instagram || null,
            photoMediaId: item.photoMediaId,
          }))
        )
      }
      renderItem={(item, update) => (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label>Name</Label>
            <Input value={item.name} onChange={(e) => update({ name: e.target.value })} />
          </div>
          <div>
            <Label>Role</Label>
            <Input value={item.role} onChange={(e) => update({ role: e.target.value })} />
          </div>
          <div>
            <Label>Instagram</Label>
            <Input value={item.instagram} onChange={(e) => update({ instagram: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label>Bio</Label>
            <Textarea value={item.bio} onChange={(e) => update({ bio: e.target.value })} rows={2} />
          </div>
          <div>
            <AdminImagePicker
              ownerId={artistId}
              role="band_member_photo"
              mediaId={item.photoMediaId}
              previewUrl={item.photoUrl}
              label="Photo"
              onChange={(mediaId, url) => update({ photoMediaId: mediaId, photoUrl: url })}
            />
          </div>
        </div>
      )}
    />
  );
}
