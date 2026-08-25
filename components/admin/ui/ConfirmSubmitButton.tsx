"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/admin/ui/Button";

// ---------------------------------------------------------------------------
// Real confirmation modal for destructive Server Action submissions
// (Reject, Archive, Unpublish, Delete/archive media, Disable admin user) —
// PHASE_4_PLAN.md Section 14 explicitly calls for a real dialog, not a bare
// window.confirm() (which we also avoid per the browser-automation/dialog
// guidance elsewhere in this environment).
// ---------------------------------------------------------------------------

interface Props {
  action: (formData: FormData) => Promise<void> | void;
  children?: ReactNode; // hidden inputs
  confirmTitle: string;
  confirmBody: string;
  label: string;
  pendingLabel?: string;
  variant?: "primary" | "danger" | "secondary";
  onDone?: () => void;
}

export function ConfirmSubmitButton({
  action,
  children,
  confirmTitle,
  confirmBody,
  label,
  pendingLabel,
  variant = "danger",
  onDone,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <Button type="button" variant={variant} size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>

      <form
        ref={formRef}
        action={(formData) =>
          startTransition(async () => {
            await action(formData);
            setOpen(false);
            onDone?.();
          })
        }
        className="hidden"
      >
        {children}
      </form>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-lg">
            <h2 className="text-base font-semibold text-[var(--admin-text)]">{confirmTitle}</h2>
            <p className="mt-2 text-sm text-[var(--admin-muted)]">{confirmBody}</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button
                type="button"
                variant={variant}
                size="sm"
                disabled={isPending}
                onClick={() => formRef.current?.requestSubmit()}
              >
                {isPending ? (pendingLabel ?? "Working…") : label}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
