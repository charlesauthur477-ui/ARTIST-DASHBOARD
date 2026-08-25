"use client";

import { useActionState } from "react";
import { loginAction, type LoginActionState } from "@/app/admin/login/actions";
import { Input, Label, FieldError } from "@/components/admin/ui/FormField";
import { SubmitButton } from "@/components/admin/ui/SubmitButton";

const initialState: LoginActionState = { error: null };

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="username" required autoFocus />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>

      <FieldError>{state.error}</FieldError>

      <SubmitButton variant="primary" className="w-full" pendingLabel="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}
