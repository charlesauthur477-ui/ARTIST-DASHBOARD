"use client";

import { useState, useTransition } from "react";
import { updateArtistProfileAction } from "@/lib/admin/artistActions";
import { AdminImagePicker } from "@/components/admin/media/AdminImagePicker";
import { FieldError } from "@/components/admin/ui/FormField";

interface Slot {
  key: "profileImageMediaId" | "heroImageMediaId" | "aboutImageMediaId" | "ogImageMediaId";
  role: "profile_photo" | "hero_photo" | "about_photo" | "og_image";
  label: string;
}

const SLOTS: Slot[] = [
  { key: "profileImageMediaId", role: "profile_photo", label: "Profile photo" },
  { key: "heroImageMediaId", role: "hero_photo", label: "Hero photo" },
  { key: "aboutImageMediaId", role: "about_photo", label: "About photo" },
  { key: "ogImageMediaId", role: "og_image", label: "Social share (OG) image" },
];

export function PhotosTabForm({
  artistId,
  initial,
}: {
  artistId: string;
  initial: Record<Slot["key"], { mediaId: string | null; url: string | null }>;
}) {
  const [images, setImages] = useState(initial);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(key: Slot["key"], mediaId: string | null, url: string | null) {
    setImages((prev) => ({ ...prev, [key]: { mediaId, url } }));
    setError(null);
    startTransition(async () => {
      const patch: Partial<Record<Slot["key"], string | null>> = {};
      patch[key] = mediaId;
      const result = await updateArtistProfileAction(artistId, patch);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {SLOTS.map((slot) => (
          <AdminImagePicker
            key={slot.key}
            ownerId={artistId}
            role={slot.role}
            mediaId={images[slot.key].mediaId}
            previewUrl={images[slot.key].url}
            label={slot.label}
            onChange={(mediaId, url) => handleChange(slot.key, mediaId, url)}
          />
        ))}
      </div>
      <FieldError>{error}</FieldError>
      <p className="text-sm text-[var(--admin-muted)]">Changes here save automatically.</p>
    </div>
  );
}
