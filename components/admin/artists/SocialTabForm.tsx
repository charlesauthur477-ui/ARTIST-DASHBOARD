"use client";

import { useState, useTransition } from "react";
import { updateArtistProfileAction } from "@/lib/admin/artistActions";
import { Input, Label, FieldError } from "@/components/admin/ui/FormField";
import { Button } from "@/components/admin/ui/Button";

const SOCIAL_PLATFORMS = ["instagram", "youtube", "spotify", "appleMusic", "tiktok", "facebook", "x"] as const;

export function SocialTabForm({
  artistId,
  initial,
}: {
  artistId: string;
  initial: { instagramHandle: string; socialLinks: Record<string, string>; streamingLinks: { spotify?: string; appleMusic?: string; youtube?: string; soundcloud?: string } };
}) {
  const [instagramHandle, setInstagramHandle] = useState(initial.instagramHandle);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>(initial.socialLinks);
  const [streamingLinks, setStreamingLinks] = useState(initial.streamingLinks);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateArtistProfileAction(artistId, {
        instagramHandle: instagramHandle || null,
        socialLinks,
        streamingLinks,
      });
      if (result.error) setError(result.error);
      else setSavedAt(Date.now());
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      <section>
        <h2 className="mb-3 text-base font-semibold">Social links</h2>
        <div className="mb-3">
          <Label>Instagram handle (without @)</Label>
          <Input value={instagramHandle} onChange={(e) => setInstagramHandle(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SOCIAL_PLATFORMS.map((platform) => (
            <div key={platform}>
              <Label>{platform}</Label>
              <Input
                value={socialLinks[platform] ?? ""}
                onChange={(e) => setSocialLinks((prev) => ({ ...prev, [platform]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold">Streaming links</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label>Spotify</Label>
            <Input value={streamingLinks.spotify ?? ""} onChange={(e) => setStreamingLinks((s) => ({ ...s, spotify: e.target.value }))} />
          </div>
          <div>
            <Label>Apple Music</Label>
            <Input value={streamingLinks.appleMusic ?? ""} onChange={(e) => setStreamingLinks((s) => ({ ...s, appleMusic: e.target.value }))} />
          </div>
          <div>
            <Label>YouTube</Label>
            <Input value={streamingLinks.youtube ?? ""} onChange={(e) => setStreamingLinks((s) => ({ ...s, youtube: e.target.value }))} />
          </div>
          <div>
            <Label>SoundCloud</Label>
            <Input value={streamingLinks.soundcloud ?? ""} onChange={(e) => setStreamingLinks((s) => ({ ...s, soundcloud: e.target.value }))} />
          </div>
        </div>
      </section>

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
