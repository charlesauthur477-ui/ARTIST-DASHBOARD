import { redirect } from "next/navigation";
import { getArtistSessionUser } from "@/lib/artist/session";
import { ArtistResetPasswordForm } from "@/components/artist/ArtistResetPasswordForm";

export default async function ArtistResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const user = await getArtistSessionUser();
  if (user) redirect("/artist/dashboard");

  const { token } = await searchParams;

  return (
    <div className="admin-shell flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-lg font-semibold text-[var(--admin-text)]">Set a new password</p>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">Choose a new password for your Artist Portal account.</p>
        </div>
        <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 shadow-sm">
          {token ? (
            <ArtistResetPasswordForm token={token} />
          ) : (
            <p className="text-sm text-[var(--admin-danger)]">
              This reset link is invalid. Please{" "}
              <a href="/artist/forgot-password" className="font-medium underline">
                request a new one
              </a>
              .
            </p>
          )}
        </div>
        <p className="mt-6 text-center text-sm text-[var(--admin-muted)]">
          <a href="/artist/login" className="font-medium text-[var(--admin-primary)] hover:underline">
            Back to sign in
          </a>
        </p>
      </div>
    </div>
  );
}
