"use client";

import { useActionState } from "react";
import { resetArtistPasswordAction, type ArtistResetPasswordState } from "@/lib/artist/authActions";
import { Input, Label, FieldError } from "@/components/admin/ui/FormField";
import { SubmitButton } from "@/components/admin/ui/SubmitButton";

const initialState: ArtistResetPasswordState = { error: null };

export function ArtistResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(resetArtistPasswordAction, initialState);

  if (state.success) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-[var(--admin-text)]">Your password has been reset.</p>
        <a href="/artist/login" className="text-sm font-medium text-[var(--admin-primary)] hover:underline">
          Sign in →
        </a>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <div>
        <Label htmlFor="newPassword">New password</Label>
        <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" required minLength={8} />
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} />
      </div>

      <FieldError>{state.error}</FieldError>

      <SubmitButton variant="primary" className="w-full" pendingLabel="Resetting…">
        Reset password
      </SubmitButton>
    </form>
  );
}
