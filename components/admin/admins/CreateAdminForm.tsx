"use client";

import { useActionState, useState } from "react";
import { createAdminUserAction, type AdminUserActionState } from "@/lib/admin/adminUserActions";
import { ADMIN_ROLES, roleLabel } from "@/lib/admin/permissions";
import { Input, Label, Select, FieldError, FieldHint } from "@/components/admin/ui/FormField";
import { SubmitButton } from "@/components/admin/ui/SubmitButton";
import { Button } from "@/components/admin/ui/Button";

const initialState: AdminUserActionState = { error: null };

// Same convention as PortalAccessCard's temporary-password generator —
// avoids visually ambiguous characters since it'll be read off screen.
const PASSWORD_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
function generateTempPassword(length = 16): string {
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const bytes = new Uint32Array(length);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => PASSWORD_CHARS[b % PASSWORD_CHARS.length]).join("");
  }
  let out = "";
  for (let i = 0; i < length; i++) out += PASSWORD_CHARS[Math.floor(Math.random() * PASSWORD_CHARS.length)];
  return out;
}

export function CreateAdminForm() {
  const [state, formAction] = useActionState(createAdminUserAction, initialState);
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  function handleGenerate() {
    setPassword(generateTempPassword());
    setPasswordVisible(true);
  }

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" type="text" required />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div>
        <Label htmlFor="role">Role</Label>
        <Select id="role" name="role" defaultValue="editor" required>
          {ADMIN_ROLES.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="password">Temporary password</Label>
        <div className="flex gap-2">
          <Input
            id="password"
            name="password"
            type={passwordVisible ? "text" : "password"}
            minLength={12}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 12 characters"
            required
            className="flex-1"
          />
          <Button type="button" variant="secondary" size="sm" onClick={handleGenerate}>
            Generate
          </Button>
        </div>
      </div>

      <div className="sm:col-span-2">
        {password ? (
          <FieldHint>
            {passwordVisible ? "Copy this now and share it securely — it won't be shown again after you save." : "Password hidden."}{" "}
            <button type="button" className="underline" onClick={() => setPasswordVisible((v) => !v)}>
              {passwordVisible ? "Hide" : "Show"}
            </button>
          </FieldHint>
        ) : null}
        <FieldError>{state.error}</FieldError>
        {state.success ? <p className="mt-1 text-xs text-emerald-600">Admin account created.</p> : null}
        <div className="mt-3">
          <SubmitButton variant="primary" size="sm" pendingLabel="Creating…">
            Create admin
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}
