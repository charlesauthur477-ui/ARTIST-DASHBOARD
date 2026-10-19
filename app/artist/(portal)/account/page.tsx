import { requireArtistSession } from "@/lib/artist/session";
import { Card, CardBody, CardHeader } from "@/components/admin/ui/Card";
import { ChangePasswordForm } from "@/components/artist/ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function ArtistPortalAccountPage() {
  const user = await requireArtistSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--admin-text)]">Account</h1>
        <p className="mt-1 text-sm text-[var(--admin-muted)]">{user.email}</p>
      </div>

      <Card>
        <CardHeader>
          <p className="font-medium">Change Password</p>
        </CardHeader>
        <CardBody>
          <ChangePasswordForm />
        </CardBody>
      </Card>
    </div>
  );
}
