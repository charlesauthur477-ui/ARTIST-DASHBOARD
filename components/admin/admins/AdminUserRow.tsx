"use client";

import { useActionState, useState } from "react";
import {
  setAdminUserRoleAction,
  setAdminUserActiveAction,
  setAdminUserPasswordAction,
  type AdminUserActionState,
} from "@/lib/admin/adminUserActions";
import { ADMIN_ROLES, roleLabel, type AdminRole } from "@/lib/admin/permissions";
import type { AdminUserRow as AdminUserRowData } from "@/lib/repositories/adminUsers";
import { Select, Input, FieldError } from "@/components/admin/ui/FormField";
import { SubmitButton } from "@/components/admin/ui/SubmitButton";
import { Button } from "@/components/admin/ui/Button";
import { Badge } from "@/components/admin/ui/Badge";

const initialPasswordState: AdminUserActionState = { error: null };

export function AdminUserRow({ admin, currentAdminId }: { admin: AdminUserRowData; currentAdminId: string }) {
  const [pending, setPending] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordState, passwordFormAction] = useActionState(setAdminUserPasswordAction, initialPasswordState);

  const isSelf = admin.id === currentAdminId;

  async function handleRoleChange(role: AdminRole) {
    setPending(true);
    setRowError(null);
    const result = await setAdminUserRoleAction(admin.id, role);
    setPending(false);
    if (result.error) {
      setRowError(result.error);
      return;
    }
    window.location.reload();
  }

  async function handleToggleActive() {
    setPending(true);
    setRowError(null);
    const result = await setAdminUserActiveAction(admin.id, !admin.isActive);
    setPending(false);
    if (result.error) {
      setRowError(result.error);
      return;
    }
    window.location.reload();
  }

  return (
    <tr className="border-b border-[var(--admin-border)] last:border-0">
      <td className="whitespace-nowrap px-4 py-3">
        <p className="text-sm font-medium text-[var(--admin-text)]">
          {admin.name || admin.email} {isSelf ? <span className="text-xs text-[var(--admin-muted)]">(you)</span> : null}
        </p>
        <p className="text-xs text-[var(--admin-muted)]">{admin.email}</p>
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <Select
          value={admin.role}
          disabled={pending}
          onChange={(e) => handleRoleChange(e.target.value as AdminRole)}
          className="w-36"
        >
          {ADMIN_ROLES.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </Select>
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <Badge tone={admin.isActive ? "success" : "danger"}>{admin.isActive ? "Active" : "Deactivated"}</Badge>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--admin-muted)]">{new Date(admin.createdAt).toLocaleDateString()}</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" size="sm" disabled={pending || isSelf} onClick={handleToggleActive}>
            {admin.isActive ? "Deactivate" : "Reactivate"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowPasswordForm((v) => !v)}>
            {showPasswordForm ? "Cancel" : "Reset password"}
          </Button>
        </div>
        {rowError ? <p className="mt-1 text-xs text-[var(--admin-danger)]">{rowError}</p> : null}

        {showPasswordForm ? (
          <form action={passwordFormAction} className="mt-2 flex max-w-xs flex-wrap items-start gap-2">
            <input type="hidden" name="adminUserId" value={admin.id} />
            <Input name="password" type="password" minLength={12} placeholder="New password (12+ chars)" required className="flex-1" />
            <SubmitButton variant="secondary" size="sm" pendingLabel="Saving…">
              Save
            </SubmitButton>
            {passwordState.error ? (
              <div className="w-full">
                <FieldError>{passwordState.error}</FieldError>
              </div>
            ) : null}
            {passwordState.success ? <p className="w-full text-xs text-emerald-600">Password updated.</p> : null}
          </form>
        ) : null}
      </td>
    </tr>
  );
}
