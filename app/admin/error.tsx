"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin] error:", error);
  }, [error]);

  return (
    <div className="admin-shell flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 shadow-sm text-center">
        <h2 className="text-lg font-semibold text-[var(--admin-text)]">Admin Error</h2>
        <p className="mt-2 text-sm text-[var(--admin-danger)]">
          {error?.message || "An unexpected error occurred."}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => reset()}
            className="rounded-md bg-[var(--admin-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--admin-primary-hover)] transition-colors"
          >
            Try again
          </button>
          <Link
            href="/admin/login"
            className="rounded-md border border-[var(--admin-border)] px-4 py-2 text-sm font-medium text-[var(--admin-text)] hover:bg-slate-50 transition-colors"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
