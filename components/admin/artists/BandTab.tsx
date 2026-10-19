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

type SaveAction = (items: BandMemberItem[]) => Promise<{ error: string | null }>;

// `saveAction` defaults to the admin Server Action (bound to `artistId`), so
// every existing admin usage is unchanged. The Artist Portal passes its own
// session-scoped action instead — see app/artist/band/page.tsx — reusing
// this exact component/UI rather than duplicating it.
export function BandTab({ artistId, items, saveAction }: { artistId: string; items: BandMemberItem[]; saveAction?: SaveAction }) {
  const onSave: SaveAction =
    saveAction ??
    ((all) =>
      replaceBandMembersAction(
        artistId,
        all.map((item) => ({
          name: item.name,
          role: item.role,
          bio: item.bio,
          instagram: item.instagram || null,
          photoMediaId: item.photoMediaId,
        }))
      ));

  return (
    <RepeatableListEditor<BandMemberItem>
      items={items}
      emptyItem={emptyItem}
      itemLabel={(item) => item.name || "Untitled member"}
      onSave={onSave}
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
