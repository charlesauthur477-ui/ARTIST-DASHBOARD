"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import type { StagedAsset } from "@/types/application";
import type { MediaRole } from "@/lib/repositories/media";
import { ACCEPTED_IMAGE_EXTENSIONS, removeStagedAsset, uploadStagedAsset } from "@/lib/uploads";

interface MultiFileInputProps {
  label: string;
  assets: StagedAsset[];
  onChange: (assets: StagedAsset[]) => void;
  applicationId: string | null;
  role: MediaRole;
  helpText?: string;
  max?: number;
}

export function MultiFileInput({ label, assets, onChange, applicationId, role, helpText, max = 12 }: MultiFileInputProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadingCount, setUploadingCount] = useState(0);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    if (!applicationId) {
      window.alert("Still preparing your application — please try again in a moment.");
      return;
    }
    const files = Array.from(fileList).slice(0, Math.max(0, max - assets.length));
    const problems: string[] = [];
    if (fileList.length > files.length) {
      problems.push(`Only the first ${max} photos were added.`);
    }

    setUploadingCount(files.length);
    const uploaded: StagedAsset[] = [];
    for (const file of files) {
      const { asset, error } = await uploadStagedAsset(file, applicationId, role);
      if (error) {
        problems.push(`${file.name}: ${error}`);
        continue;
      }
      if (asset) uploaded.push(asset);
    }
    setUploadingCount(0);

    if (uploaded.length) onChange([...assets, ...uploaded]);
    if (problems.length) window.alert(problems.join("\n"));
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeAt(assetId: string) {
    const target = assets.find((a) => a.id === assetId);
    void removeStagedAsset(target);
    onChange(assets.filter((a) => a.id !== assetId));
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground/85">{label}</label>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {assets.map((asset) => (
          <div key={asset.id} className="relative aspect-square overflow-hidden rounded-md bg-surface">
            <Image src={asset.previewUrl} alt={asset.fileName} fill sizes="120px" className="object-cover" unoptimized />
            <button
              type="button"
              onClick={() => removeAt(asset.id)}
              aria-label={`Remove ${asset.fileName}`}
              className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {uploadingCount > 0
          ? Array.from({ length: uploadingCount }).map((_, i) => (
              <div
                key={`uploading-${i}`}
                className="flex aspect-square items-center justify-center rounded-md border border-dashed border-border-subtle text-muted"
              >
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ))
          : null}

        {assets.length < max && uploadingCount === 0 ? (
          <label
            htmlFor={id}
            className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border-subtle text-center transition hover:border-bronze-400/60"
          >
            <ImagePlus className="h-5 w-5 text-muted" aria-hidden="true" />
            <span className="text-xs text-foreground/80">Add photos</span>
          </label>
        ) : null}
      </div>

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ACCEPTED_IMAGE_EXTENSIONS}
        multiple
        className="sr-only"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      {assets.length > 0 ? (
        <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
          {assets.length} photo{assets.length === 1 ? "" : "s"} uploaded
        </p>
      ) : null}
      {helpText ? <p className="mt-1.5 text-xs text-muted">{helpText}</p> : null}
    </div>
  );
}
