"use client";

import { useId, useRef } from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import type { StagedAsset } from "@/types/application";
import { ACCEPTED_IMAGE_EXTENSIONS, revokeStagedAsset, stageLocalFile } from "@/lib/uploads";

interface MultiFileInputProps {
  label: string;
  assets: StagedAsset[];
  onChange: (assets: StagedAsset[]) => void;
  helpText?: string;
  max?: number;
}

export function MultiFileInput({ label, assets, onChange, helpText, max = 12 }: MultiFileInputProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const next = [...assets];
    const problems: string[] = [];
    for (const file of Array.from(fileList)) {
      if (next.length >= max) {
        problems.push(`Only the first ${max} photos were added.`);
        break;
      }
      const { asset, error } = stageLocalFile(file);
      if (error) {
        problems.push(`${file.name}: ${error}`);
        continue;
      }
      if (asset) next.push(asset);
    }
    onChange(next);
    if (problems.length) window.alert(problems.join("\n"));
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeAt(assetId: string) {
    const target = assets.find((a) => a.id === assetId);
    revokeStagedAsset(target);
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

        {assets.length < max ? (
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
        onChange={(e) => handleFiles(e.target.files)}
      />

      {assets.length > 0 ? (
        <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-bronze-400/10 px-2 py-0.5 text-[11px] font-medium text-bronze-300">
          {assets.length} photo{assets.length === 1 ? "" : "s"} attached — not yet uploaded to storage
        </p>
      ) : null}
      {helpText ? <p className="mt-1.5 text-xs text-muted">{helpText}</p> : null}
    </div>
  );
}
