import { redirect } from "next/navigation";
import { getArtistSessionUser } from "@/lib/artist/session";
import { ArtistForgotPasswordForm } from "@/components/artist/ArtistForgotPasswordForm";

export default async function ArtistForgotPasswordPage() {
  const user = await getArtistSessionUser();
  if (user) redirect("/artist/dashboard");

  return (
    <div className="admin-shell flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-lg font-semibold text-[var(--admin-text)]">Reset your password</p>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">Enter your Artist Portal email and we&apos;ll send you a reset link.</p>
        </div>
        <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 shadow-sm">
          <ArtistForgotPasswordForm />
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
