"use client";

import { replacePerformanceFormatsAction } from "@/lib/admin/artistActions";
import { RepeatableListEditor } from "@/components/admin/artists/RepeatableListEditor";
import { Input, Label, Textarea } from "@/components/admin/ui/FormField";

export interface PerformanceFormatItem {
  formatId: string;
  name: string;
  lineup: string;
  style: string;
  suitableFor: string; // comma-separated in the UI, split into string[] on save
}

const emptyItem: PerformanceFormatItem = { formatId: "", name: "", lineup: "", style: "", suitableFor: "" };

export function PerformanceTab({ artistId, items }: { artistId: string; items: PerformanceFormatItem[] }) {
  return (
    <RepeatableListEditor<PerformanceFormatItem>
      items={items}
      emptyItem={emptyItem}
      itemLabel={(item) => item.name || "Untitled format"}
      onSave={async (all) =>
        replacePerformanceFormatsAction(
          artistId,
          all.map((item) => ({
            formatId: item.formatId,
            name: item.name,
            lineup: item.lineup,
            style: item.style,
            suitableFor: item.suitableFor
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
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
            <Label>Format ID (e.g. solo, duo, full-band)</Label>
            <Input value={item.formatId} onChange={(e) => update({ formatId: e.target.value })} />
          </div>
          <div>
            <Label>Lineup</Label>
            <Input value={item.lineup} onChange={(e) => update({ lineup: e.target.value })} />
          </div>
          <div>
            <Label>Suitable for (comma-separated)</Label>
            <Input value={item.suitableFor} onChange={(e) => update({ suitableFor: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label>Style</Label>
            <Textarea value={item.style} onChange={(e) => update({ style: e.target.value })} rows={2} />
          </div>
        </div>
      )}
    />
  );
}
