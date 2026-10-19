import { requireRole } from "@/lib/admin/auth";
import { listAdminUsers } from "@/lib/repositories/adminUsers";
import { Card } from "@/components/admin/ui/Card";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { CreateAdminForm } from "@/components/admin/admins/CreateAdminForm";
import { AdminUserRow } from "@/components/admin/admins/AdminUserRow";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  // canManageAdmins restricts this entire page to super_admin — the same
  // rule enforced independently inside every Server Action in
  // lib/admin/adminUserActions.ts, so hitting an action directly is stopped
  // too, not just this page.
  const actor = await requireRole(["super_admin"]);

  const admins = await listAdminUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--admin-text)]">Admin Users</h1>
        <p className="mt-1 text-sm text-[var(--admin-muted)]">
          Manage who can sign in to this dashboard, their role, and their account status.
        </p>
      </div>

      <Card>
        <div className="border-b border-[var(--admin-border)] px-5 py-4">
          <p className="text-sm font-medium text-[var(--admin-text)]">Create admin account</p>
        </div>
        <div className="px-5 py-4">
          <CreateAdminForm />
        </div>
      </Card>

      {admins.length === 0 ? (
        <EmptyState title="No admin accounts found" />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-[var(--admin-border)] text-xs font-medium uppercase text-[var(--admin-muted)]">
                <th className="px-4 py-3">Admin</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <AdminUserRow key={admin.id} admin={admin} currentAdminId={actor.id} />
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
