"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import { CheckCircle2, ImagePlus, Loader2, X } from "lucide-react";
import type { StagedAsset } from "@/types/application";
import type { MediaRole } from "@/lib/repositories/media";
import { ACCEPTED_IMAGE_EXTENSIONS, formatFileSize, removeStagedAsset, uploadStagedAsset } from "@/lib/uploads";

interface FileInputProps {
  label: string;
  asset: StagedAsset | null;
  onChange: (asset: StagedAsset | null) => void;
  applicationId: string | null;
  role: MediaRole;
  required?: boolean;
  error?: string;
  helpText?: string;
}

/**
 * A single-photo picker. Uploads to permanent storage (Vercel Blob) as soon
 * as a file is chosen — see lib/uploads.ts#uploadStagedAsset — and shows a
 * real "Uploaded" state once that completes, rather than the pre-Phase-3
 * "attached, not yet uploaded" placeholder.
 */
export function FileInput({ label, asset, onChange, applicationId, role, required, error, helpText }: FileInputProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    if (!applicationId) {
      setUploadError("Still preparing your application — please try again in a moment.");
      return;
    }
    setUploadError(null);
    setUploading(true);
    const { asset: uploaded, error: stageError } = await uploadStagedAsset(file, applicationId, role);
    setUploading(false);
    if (stageError || !uploaded) {
      setUploadError(stageError ?? "Upload failed. Please try again.");
      return;
    }
    if (asset) void removeStagedAsset(asset);
    onChange(uploaded);
  }

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-foreground/85">
        {label} {required ? <span className="text-bronze-300">*</span> : null}
      </label>

      {uploading ? (
        <div className="flex min-h-24 w-full items-center justify-center gap-2 rounded-md border border-dashed border-border-subtle px-4 py-6 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
        </div>
      ) : asset ? (
        <div className="flex items-center gap-3 rounded-md border border-border-subtle p-3">
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-surface">
            <Image src={asset.previewUrl} alt={`${label} preview`} fill sizes="64px" className="object-cover" unoptimized />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-foreground/90">{asset.fileName}</p>
            <p className="text-xs text-muted">{formatFileSize(asset.fileSizeBytes)}</p>
            <p className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> Uploaded
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              void removeStagedAsset(asset);
              onChange(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            aria-label={`Remove ${label}`}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-muted hover:text-red-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={id}
          className="flex min-h-24 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border-subtle px-4 py-6 text-center transition hover:border-bronze-400/60"
        >
          <ImagePlus className="h-5 w-5 text-muted" aria-hidden="true" />
          <span className="text-sm text-foreground/80">Tap to choose a photo</span>
          <span className="text-xs text-muted">JPG, PNG, or WEBP</span>
        </label>
      )}

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ACCEPTED_IMAGE_EXTENSIONS}
        className="sr-only"
        onChange={(e) => void handleFile(e.target.files)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
      />

      {helpText && !error && !uploadError ? (
        <p id={`${id}-help`} className="mt-1.5 text-xs text-muted">
          {helpText}
        </p>
      ) : null}
      {uploadError ? (
        <p className="mt-1.5 text-xs text-red-400">{uploadError}</p>
      ) : error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
