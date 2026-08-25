"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { uploadMedia } from "@/lib/media";
import { deleteMedia } from "@/lib/media";
import type { MediaRole } from "@/lib/repositories/media";
import { Button } from "@/components/admin/ui/Button";

// ---------------------------------------------------------------------------
// Generalized image upload/replace/remove control — PHASE_4_PLAN.md Section
// 7 ("generalizing the existing FileInput/MultiFileInput components to
// accept ownerType: artist and any MediaRole"). Calls the SAME upload/delete
// Server Actions the applicant-facing wizard uses (lib/media.ts) — no
// second upload system. Used both for an artist's single-slot images
// (profile/hero/about/og — Photos tab) and for a repeatable item's image
// (release cover art, band member photo, etc. — RepeatableListEditor).
// ---------------------------------------------------------------------------

interface Props {
  ownerId: string;
  role: MediaRole;
  mediaId: string | null;
  previewUrl?: string | null;
  label: string;
  onChange: (mediaId: string | null, url: string | null) => void;
}

export function AdminImagePicker({ ownerId, role, mediaId, previewUrl, label, onChange }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(previewUrl ?? null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    startTransition(async () => {
      const previousMediaId = mediaId;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("ownerType", "artist");
      formData.append("ownerId", ownerId);
      formData.append("role", role);

      const result = await uploadMedia(formData);
      if (!result.success || !result.media) {
        setError(result.error ?? "Upload failed.");
        return;
      }

      setLocalPreview(result.media.url);
      onChange(result.media.id, result.media.url);

      if (previousMediaId) {
        await deleteMedia(previousMediaId).catch(() => {});
      }
    });

    if (inputRef.current) inputRef.current.value = "";
  }

  function handleRemove() {
    setError(null);
    startTransition(async () => {
      if (mediaId) await deleteMedia(mediaId).catch(() => {});
      setLocalPreview(null);
      onChange(null, null);
    });
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-[var(--admin-text)]">{label}</p>
      <div className="flex items-center gap-3">
        <div className="relative h-20 w-20 overflow-hidden rounded-md border border-[var(--admin-border)] bg-slate-100">
          {localPreview ? (
            <Image src={localPreview} alt={label} fill sizes="80px" className="object-cover" unoptimized />
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="inline-flex cursor-pointer items-center">
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} disabled={isPending} />
            <Button type="button" variant="secondary" size="sm" disabled={isPending} onClick={() => inputRef.current?.click()}>
              {isPending ? "Uploading…" : localPreview ? "Replace" : "Upload"}
            </Button>
          </label>
          {localPreview ? (
            <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={handleRemove}>
              Remove
            </Button>
          ) : null}
        </div>
      </div>
      {error ? <p className="mt-1 text-sm text-[var(--admin-danger)]">{error}</p> : null}
    </div>
  );
}
