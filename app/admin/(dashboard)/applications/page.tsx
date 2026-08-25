import Link from "next/link";
import { clsx } from "clsx";
import { listApplications, type ApplicationStatus } from "@/lib/repositories/applications";
import { Card } from "@/components/admin/ui/Card";
import { ApplicationStatusBadge } from "@/components/admin/ui/Badge";
import { EmptyState } from "@/components/admin/ui/EmptyState";

export const dynamic = "force-dynamic";

const STATUS_TABS: { label: string; value: ApplicationStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Submitted", value: "submitted" },
  { label: "Under Review", value: "under_review" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeStatus = (STATUS_TABS.find((t) => t.value === status)?.value ?? "all") as ApplicationStatus | "all";

  const applications = await listApplications(activeStatus === "all" ? undefined : activeStatus);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--admin-text)]">Applications</h1>
        <p className="mt-1 text-sm text-[var(--admin-muted)]">Review artist applications submitted through the public site.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value === "all" ? "/admin/applications" : `/admin/applications?status=${tab.value}`}
            className={clsx(
              "rounded-full px-3 py-1.5 text-sm font-medium",
              activeStatus === tab.value ? "bg-[var(--admin-primary)] text-white" : "bg-white text-slate-600 border border-[var(--admin-border)]"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {applications.length === 0 ? (
        <EmptyState title="No applications" description="No applications match this filter." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-[var(--admin-border)] text-xs uppercase text-[var(--admin-muted)]">
              <tr>
                <th className="px-4 py-3">Applicant</th>
                <th className="px-4 py-3">Genre</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} className="border-b border-[var(--admin-border)] last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/applications/${app.id}`} className="font-medium text-[var(--admin-text)] hover:underline">
                      {app.stageName || app.realName || "Untitled applicant"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--admin-muted)]">{app.primaryGenre || "—"}</td>
                  <td className="px-4 py-3 text-[var(--admin-muted)]">{[app.city, app.country].filter(Boolean).join(", ") || "—"}</td>
                  <td className="px-4 py-3 text-[var(--admin-muted)]">
                    {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <ApplicationStatusBadge status={app.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
