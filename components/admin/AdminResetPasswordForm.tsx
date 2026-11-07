"use client";

import { useActionState } from "react";
import Link from "next/link";
import { adminResetPasswordAction, type AdminResetState } from "@/app/admin/reset-password/actions";
import { Input, Label, FieldError, FieldHint } from "@/components/admin/ui/FormField";
import { SubmitButton } from "@/components/admin/ui/SubmitButton";

const initialState: AdminResetState = { error: null };

export function AdminResetPasswordForm() {
  const [state, formAction] = useActionState(adminResetPasswordAction, initialState);

  if (state.success) {
    return (
      <div className="space-y-4">
        <div className="rounded-md bg-green-50 p-4 border border-green-200">
          <p className="text-sm font-medium text-green-800">
            Password reset successfully!
          </p>
          <p className="mt-1 text-xs text-green-700">
            You can now log in to the admin panel with your new password.
          </p>
        </div>
        <Link
          href="/admin/login"
          className="inline-flex w-full items-center justify-center rounded-md bg-[var(--admin-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--admin-primary-hover)] transition-colors"
        >
          Return to Sign In
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="email">Admin Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="your-admin@example.com"
          required
          autoFocus
        />
      </div>

      <div>
        <Label htmlFor="newPassword">New Password</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Min 12 characters"
          required
        />
        <FieldHint>Must be at least 12 characters long.</FieldHint>
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat new password"
          required
        />
      </div>

      <FieldError>{state.error}</FieldError>

      <SubmitButton variant="primary" className="w-full" pendingLabel="Updating…">
        Reset Password
      </SubmitButton>
    </form>
  );
}
