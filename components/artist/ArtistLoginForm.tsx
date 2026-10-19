"use client";

import { useActionState } from "react";
import { artistLoginAction, type ArtistAuthState } from "@/lib/artist/authActions";
import { Input, Label, FieldError } from "@/components/admin/ui/FormField";
import { SubmitButton } from "@/components/admin/ui/SubmitButton";

const initialState: ArtistAuthState = { error: null };

export function ArtistLoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction] = useActionState(artistLoginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="username" required autoFocus />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <a href="/artist/forgot-password" className="mb-1.5 text-sm font-medium text-[var(--admin-primary)] hover:underline">
            Forgot password?
          </a>
        </div>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>

      <FieldError>{state.error}</FieldError>

      <SubmitButton variant="primary" className="w-full" pendingLabel="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}
