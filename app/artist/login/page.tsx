import { redirect } from "next/navigation";
import { getArtistSessionUser } from "@/lib/artist/session";
import { ArtistLoginForm } from "@/components/artist/ArtistLoginForm";

export default async function ArtistLoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const user = await getArtistSessionUser();
  if (user) redirect("/artist/dashboard");

  const { callbackUrl } = await searchParams;

  return (
    <div className="admin-shell flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-lg font-semibold text-[var(--admin-text)]">Artist Portal</p>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">Sign in to manage your profile, bookings, and availability.</p>
        </div>
        <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 shadow-sm">
          <ArtistLoginForm callbackUrl={callbackUrl ?? "/artist/dashboard"} />
        </div>
      </div>
    </div>
  );
}
