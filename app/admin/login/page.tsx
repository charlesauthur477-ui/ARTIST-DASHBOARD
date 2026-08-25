import { redirect } from "next/navigation";
import { getAdminSessionUser } from "@/lib/admin/auth";
import { LoginForm } from "@/components/admin/LoginForm";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const user = await getAdminSessionUser();
  if (user) redirect("/admin");

  const { callbackUrl } = await searchParams;

  return (
    <div className="admin-shell flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-lg font-semibold text-[var(--admin-text)]">Wavelength Admin</p>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">Sign in to manage artists and applications.</p>
        </div>
        <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 shadow-sm">
          <LoginForm callbackUrl={callbackUrl ?? "/admin"} />
        </div>
      </div>
    </div>
  );
}
