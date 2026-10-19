"use client";

import { useActionState, useState } from "react";
import { setArtistPortalAccessAction, setArtistPortalActiveAction, type ArtistUserActionState } from "@/lib/admin/artistUserActions";
import { Input, Label, FieldError, FieldHint } from "@/components/admin/ui/FormField";
import { SubmitButton } from "@/components/admin/ui/SubmitButton";
import { Button } from "@/components/admin/ui/Button";
import { Badge } from "@/components/admin/ui/Badge";

const initialState: ArtistUserActionState = { error: null };

// A random, easy-to-read temporary password — avoids visually ambiguous
// characters (0/O, 1/l/I) since an admin will be reading this off screen and
// relaying it to the artist by phone/email/text.
const PASSWORD_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
function generateTempPassword(length = 12): string {
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const bytes = new Uint32Array(length);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => PASSWORD_CHARS[b % PASSWORD_CHARS.length]).join("");
  }
  // Fallback (should not be reached in a browser context, but avoids a hard crash).
  let out = "";
  for (let i = 0; i < length; i++) out += PASSWORD_CHARS[Math.floor(Math.random() * PASSWORD_CHARS.length)];
  return out;
}

export function PortalAccessCard({
  artistId,
  existingEmail,
  isActive,
}: {
  artistId: string;
  existingEmail: string | null;
  isActive: boolean | null;
}) {
  const [state, formAction] = useActionState(setArtistPortalAccessAction, initialState);
  const [pending, setPending] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  function handleGenerate() {
    setPassword(generateTempPassword());
    setPasswordVisible(true);
  }

  return (
    <div className="space-y-4">
      {existingEmail ? (
        <div className="flex items-center justify-between rounded-md border border-[var(--admin-border)] p-3">
          <div>
            <p className="text-sm font-medium">{existingEmail}</p>
            <p className="text-xs text-[var(--admin-muted)]">Artist portal login</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={isActive ? "success" : "danger"}>{isActive ? "Active" : "Deactivated"}</Badge>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={async () => {
                setPending(true);
                await setArtistPortalActiveAction(artistId, !isActive);
                setPending(false);
                window.location.reload();
              }}
            >
              {isActive ? "Deactivate" : "Reactivate"}
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--admin-muted)]">This artist has no portal login yet — create one below.</p>
      )}

      <form action={formAction} className="max-w-sm space-y-2">
        <input type="hidden" name="artistId" value={artistId} />
        <Label htmlFor="portalEmail">Email</Label>
        <Input id="portalEmail" name="email" type="email" defaultValue={existingEmail ?? ""} required />

        <Label htmlFor="portalPassword">{existingEmail ? "Reset password (leave blank to keep current)" : "Temporary password"}</Label>
        <div className="flex gap-2">
          <Input
            id="portalPassword"
            name="password"
            type={passwordVisible ? "text" : "password"}
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={existingEmail ? "Leave blank to keep current password" : "Required for a new login"}
            className="flex-1"
          />
          <Button type="button" variant="secondary" size="sm" onClick={handleGenerate}>
            Generate
          </Button>
        </div>
        {password ? (
          <>
            <p className="text-xs text-[var(--admin-muted)]">
              {passwordVisible ? "Copy this now — it won't be shown again after you save." : "Password hidden."}{" "}
              <button type="button" className="underline" onClick={() => setPasswordVisible((v) => !v)}>
                {passwordVisible ? "Hide" : "Show"}
              </button>
            </p>
            <label className="flex items-center gap-2 text-xs text-[var(--admin-muted)]">
              <input type="checkbox" name="notifyArtist" defaultChecked className="h-4 w-4 rounded border-[var(--admin-border)]" />
              Email these credentials to the artist automatically
            </label>
          </>
        ) : null}

        <FieldHint>The artist signs in at /artist/login with this email and password. They can change their password afterward from Account.</FieldHint>
        <FieldError>{state.error}</FieldError>
        {state.success ? <p className="text-xs text-emerald-600">Saved.</p> : null}
        <SubmitButton variant="primary" size="sm" pendingLabel="Saving…">
          {existingEmail ? "Update Login" : "Create Login"}
        </SubmitButton>
      </form>
    </div>
  );
}
