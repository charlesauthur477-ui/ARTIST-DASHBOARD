"use client";

import { useState, useTransition } from "react";
import { updateArtistProfileAction, replaceCollaborationsAction, replaceTestimonialsAction } from "@/lib/admin/artistActions";
import { RepeatableListEditor } from "@/components/admin/artists/RepeatableListEditor";
import { AdminImagePicker } from "@/components/admin/media/AdminImagePicker";
import { Input, Label, Textarea, FieldError } from "@/components/admin/ui/FormField";
import { Button } from "@/components/admin/ui/Button";

export interface CollaborationItem {
  name: string;
  type: string;
  logoMediaId: string | null;
  logoUrl: string | null;
  description: string;
}

export interface TestimonialItem {
  quote: string;
  clientName: string;
  eventType: string;
}

const emptyCollab: CollaborationItem = { name: "", type: "", logoMediaId: null, logoUrl: null, description: "" };
const emptyTestimonial: TestimonialItem = { quote: "", clientName: "", eventType: "" };

export function PressTab({
  artistId,
  pressKit,
  collaborations,
  testimonials,
}: {
  artistId: string;
  pressKit: { bio: string; shortBio: string; downloadUrl: string };
  collaborations: CollaborationItem[];
  testimonials: TestimonialItem[];
}) {
  const [kit, setKit] = useState(pressKit);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function saveKit() {
    setError(null);
    startTransition(async () => {
      const result = await updateArtistProfileAction(artistId, { pressKit: kit });
      if (result.error) setError(result.error);
      else setSavedAt(Date.now());
    });
  }

  return (
    <div className="space-y-8">
      <section className="max-w-2xl space-y-3">
        <h2 className="text-base font-semibold">Press Kit</h2>
        <div>
          <Label>Short bio (used on the press page)</Label>
          <Textarea value={kit.shortBio} onChange={(e) => setKit((k) => ({ ...k, shortBio: e.target.value }))} rows={2} />
        </div>
        <div>
          <Label>Full press bio</Label>
          <Textarea value={kit.bio} onChange={(e) => setKit((k) => ({ ...k, bio: e.target.value }))} rows={5} />
        </div>
        <div>
          <Label>Press kit download URL</Label>
          <Input value={kit.downloadUrl} onChange={(e) => setKit((k) => ({ ...k, downloadUrl: e.target.value }))} />
        </div>
        <FieldError>{error}</FieldError>
        <div className="flex items-center gap-3">
          <Button type="button" variant="primary" size="sm" onClick={saveKit} disabled={isPending}>
            {isPending ? "Saving…" : "Save Press Kit"}
          </Button>
          {savedAt ? <span className="text-sm text-[var(--admin-success)]">Saved.</span> : null}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold">Collaborations</h2>
        <RepeatableListEditor<CollaborationItem>
          items={collaborations}
          emptyItem={emptyCollab}
          itemLabel={(item) => item.name || "Untitled collaboration"}
          onSave={async (all) =>
            replaceCollaborationsAction(
              artistId,
              all.map((item) => ({
                name: item.name,
                type: item.type,
                logoMediaId: item.logoMediaId,
                description: item.description || null,
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
                <Label>Type</Label>
                <Input value={item.type} onChange={(e) => update({ type: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label>Description</Label>
                <Textarea value={item.description} onChange={(e) => update({ description: e.target.value })} rows={2} />
              </div>
              <div>
                <AdminImagePicker
                  ownerId={artistId}
                  role="gallery_photo"
                  mediaId={item.logoMediaId}
                  previewUrl={item.logoUrl}
                  label="Logo"
                  onChange={(mediaId, url) => update({ logoMediaId: mediaId, logoUrl: url })}
                />
              </div>
            </div>
          )}
        />
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold">Testimonials</h2>
        <RepeatableListEditor<TestimonialItem>
          items={testimonials}
          emptyItem={emptyTestimonial}
          itemLabel={(item) => item.clientName || "Untitled testimonial"}
          onSave={async (all) => replaceTestimonialsAction(artistId, all)}
          renderItem={(item, update) => (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label>Client name</Label>
                <Input value={item.clientName} onChange={(e) => update({ clientName: e.target.value })} />
              </div>
              <div>
                <Label>Event type</Label>
                <Input value={item.eventType} onChange={(e) => update({ eventType: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label>Quote</Label>
                <Textarea value={item.quote} onChange={(e) => update({ quote: e.target.value })} rows={2} />
              </div>
            </div>
          )}
        />
      </section>
    </div>
  );
}
