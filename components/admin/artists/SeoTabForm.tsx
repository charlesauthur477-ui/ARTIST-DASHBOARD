"use client";

import { useState, useTransition } from "react";
import { updateArtistProfileAction } from "@/lib/admin/artistActions";
import { Input, Label, Textarea, FieldError, FieldHint } from "@/components/admin/ui/FormField";
import { Button } from "@/components/admin/ui/Button";

export function SeoTabForm({
  artistId,
  initial,
}: {
  artistId: string;
  initial: { seoTitle: string; seoDescription: string; canonicalUrl: string };
}) {
  const [values, setValues] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateArtistProfileAction(artistId, {
        seoTitle: values.seoTitle || null,
        seoDescription: values.seoDescription || null,
        canonicalUrl: values.canonicalUrl || null,
      });
      if (result.error) setError(result.error);
      else setSavedAt(Date.now());
    });
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <Label>SEO title</Label>
        <Input value={values.seoTitle} onChange={(e) => setValues((v) => ({ ...v, seoTitle: e.target.value }))} />
        <FieldHint>Leave blank to fall back to the artist&apos;s name.</FieldHint>
      </div>
      <div>
        <Label>SEO description</Label>
        <Textarea value={values.seoDescription} onChange={(e) => setValues((v) => ({ ...v, seoDescription: e.target.value }))} rows={3} />
        <FieldHint>Leave blank to fall back to the short bio.</FieldHint>
      </div>
      <div>
        <Label>Canonical URL</Label>
        <Input value={values.canonicalUrl} onChange={(e) => setValues((v) => ({ ...v, canonicalUrl: e.target.value }))} />
      </div>
      <FieldError>{error}</FieldError>
      <div className="flex items-center gap-3">
        <Button type="button" variant="primary" onClick={save} disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </Button>
        {savedAt ? <span className="text-sm text-[var(--admin-success)]">Saved.</span> : null}
      </div>
    </div>
  );
}
