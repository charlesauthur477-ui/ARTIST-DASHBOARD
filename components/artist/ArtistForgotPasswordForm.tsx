"use client";

import { useActionState } from "react";
import { requestArtistPasswordResetAction, type ArtistForgotPasswordState } from "@/lib/artist/authActions";
import { Input, Label, FieldError } from "@/components/admin/ui/FormField";
import { SubmitButton } from "@/components/admin/ui/SubmitButton";

const initialState: ArtistForgotPasswordState = { error: null };

export function ArtistForgotPasswordForm() {
  const [state, formAction] = useActionState(requestArtistPasswordResetAction, initialState);

  if (state.success) {
    return (
      <p className="text-sm text-[var(--admin-text)]">
        If that email matches an Artist Portal account, we&apos;ve sent a password reset link. It expires in 1 hour — check your inbox
        (and spam folder).
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="username" required autoFocus />
      </div>

      <FieldError>{state.error}</FieldError>

      <SubmitButton variant="primary" className="w-full" pendingLabel="Sending…">
        Send reset link
      </SubmitButton>
    </form>
  );
}
