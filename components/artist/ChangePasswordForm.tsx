"use client";

import { useActionState } from "react";
import { changeArtistPasswordAction, type ArtistPasswordChangeState } from "@/lib/artist/authActions";
import { Input, Label, FieldError } from "@/components/admin/ui/FormField";
import { SubmitButton } from "@/components/admin/ui/SubmitButton";

const initialState: ArtistPasswordChangeState = { error: null };

export function ChangePasswordForm() {
  const [state, formAction] = useActionState(changeArtistPasswordAction, initialState);

  return (
    <form action={formAction} className="max-w-sm space-y-3">
      <div>
        <Label htmlFor="currentPassword">Current password</Label>
        <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
      </div>
      <div>
        <Label htmlFor="newPassword">New password</Label>
        <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <FieldError>{state.error}</FieldError>
      {state.success ? <p className="text-sm text-emerald-600">Password updated.</p> : null}
      <SubmitButton variant="primary" pendingLabel="Saving…">
        Change Password
      </SubmitButton>
    </form>
  );
}
