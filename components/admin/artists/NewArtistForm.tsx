"use client";

import { useActionState, useState } from "react";
import { createArtistAction, type ArtistActionState } from "@/lib/admin/artistActions";
import { Input, Label, FieldError, FieldHint, Textarea } from "@/components/admin/ui/FormField";
import { SubmitButton } from "@/components/admin/ui/SubmitButton";
import { slugify } from "@/lib/slug";

const initialState: ArtistActionState = { error: null };

export function NewArtistForm() {
  const [state, formAction] = useActionState(createArtistAction, initialState);
  const [stageName, setStageName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <div>
        <Label htmlFor="stageName">Stage name</Label>
        <Input
          id="stageName"
          name="stageName"
          required
          value={stageName}
          onChange={(e) => {
            setStageName(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
        />
      </div>

      <div>
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          name="slug"
          required
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(slugify(e.target.value));
          }}
        />
        <FieldHint>Public URL will be /artists/{slug || "…"}</FieldHint>
      </div>

      <div>
        <Label htmlFor="genre">Genre</Label>
        <Input id="genre" name="genre" required />
      </div>

      <div>
        <Label htmlFor="shortBio">Short bio</Label>
        <Textarea id="shortBio" name="shortBio" required rows={3} />
      </div>

      <FieldHint>This artist will be created as a draft. It will never automatically become public — you publish it explicitly when it&apos;s ready.</FieldHint>
      <FieldError>{state.error}</FieldError>

      <SubmitButton variant="primary" pendingLabel="Creating…">
        Create Artist
      </SubmitButton>
    </form>
  );
}
