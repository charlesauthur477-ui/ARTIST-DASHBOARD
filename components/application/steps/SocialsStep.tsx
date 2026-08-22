import { StepShell } from "@/components/application/StepShell";
import { TextInput } from "@/components/application/fields/TextInput";
import type { StepComponentProps } from "./types";

const PLATFORMS: { key: keyof StepComponentProps["data"]["socialLinks"]; label: string; placeholder: string }[] = [
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/yourname" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@yourname" },
  { key: "spotify", label: "Spotify", placeholder: "https://open.spotify.com/artist/..." },
  { key: "appleMusic", label: "Apple Music", placeholder: "https://music.apple.com/artist/..." },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@yourname" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/yourname" },
  { key: "x", label: "X (Twitter)", placeholder: "https://x.com/yourname" },
  { key: "website", label: "Website", placeholder: "https://yourdomain.com" },
  { key: "other", label: "Other", placeholder: "Any other relevant link" },
];

export function SocialsStep({ data, update }: StepComponentProps) {
  function updateLink(key: string, value: string) {
    update("socialLinks", { ...data.socialLinks, [key]: value || undefined });
  }

  return (
    <StepShell
      title="Social Media"
      description="Add links to your existing profiles — only fill in what applies. We will never ask you for a password, API key, or access token for any of these platforms."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {PLATFORMS.map((p) => (
          <TextInput
            key={p.key}
            label={p.label}
            type="url"
            value={(data.socialLinks as Record<string, string | undefined>)[p.key] ?? ""}
            onChange={(v) => updateLink(p.key, v)}
            placeholder={p.placeholder}
          />
        ))}
      </div>
    </StepShell>
  );
}
