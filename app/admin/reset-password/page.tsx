import Link from "next/link";
import { AdminResetPasswordForm } from "@/components/admin/AdminResetPasswordForm";

export const dynamic = "force-dynamic";

export default function AdminResetPasswordPage() {
  return (
    <div className="admin-shell flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-lg font-semibold text-[var(--admin-text)]">Reset Admin Password</p>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">Set a new password for your admin account.</p>
        </div>
        <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 shadow-sm">
          <AdminResetPasswordForm />
        </div>
        <p className="mt-6 text-center text-sm text-[var(--admin-muted)]">
          <Link href="/admin/login" className="font-medium text-[var(--admin-primary)] hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
