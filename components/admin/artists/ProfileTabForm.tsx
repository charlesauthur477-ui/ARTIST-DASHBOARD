"use client";

import { useState, useTransition } from "react";
import { updateArtistProfileAction } from "@/lib/admin/artistActions";
import { Input, Label, Textarea, FieldError } from "@/components/admin/ui/FormField";
import { Button } from "@/components/admin/ui/Button";

export function ProfileTabForm({
  artistId,
  initial,
}: {
  artistId: string;
  initial: { name: string; stageName: string; tagline: string; genre: string; location: string; bio: string; shortBio: string };
}) {
  const [values, setValues] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateArtistProfileAction(artistId, values);
      if (result.error) setError(result.error);
      else setSavedAt(Date.now());
    });
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="stageName">Stage name</Label>
          <Input id="stageName" value={values.stageName} onChange={(e) => set("stageName", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="name">Legal / real name</Label>
          <Input id="name" value={values.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="genre">Genre</Label>
          <Input id="genre" value={values.genre} onChange={(e) => set("genre", e.target.value)} />
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input id="location" value={values.location} onChange={(e) => set("location", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input id="tagline" value={values.tagline} onChange={(e) => set("tagline", e.target.value)} />
        </div>
      </div>

      <div>
        <Label htmlFor="shortBio">Short bio</Label>
        <Textarea id="shortBio" value={values.shortBio} onChange={(e) => set("shortBio", e.target.value)} rows={2} />
      </div>
      <div>
        <Label htmlFor="bio">Full bio</Label>
        <Textarea id="bio" value={values.bio} onChange={(e) => set("bio", e.target.value)} rows={6} />
      </div>

      <FieldError>{error}</FieldError>

      <div className="flex items-center gap-3">
        <Button type="button" variant="primary" onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving…" : "Save Profile"}
        </Button>
        {savedAt ? <span className="text-sm text-[var(--admin-success)]">Saved.</span> : null}
      </div>
    </div>
  );
}
