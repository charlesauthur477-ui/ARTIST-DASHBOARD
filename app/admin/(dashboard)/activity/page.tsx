import { requireRole } from "@/lib/admin/auth";
import { listRecentActivity } from "@/lib/admin/activity";
import { Card } from "@/components/admin/ui/Card";
import { EmptyState } from "@/components/admin/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function AdminActivityPage() {
  // canViewActivity restricts this to super_admin/manager (PHASE_4_PLAN.md
  // Section 3's capability table) — editors can act, but the full audit
  // trail is a manager/super_admin concern.
  await requireRole(["super_admin", "manager"]);

  const events = await listRecentActivity(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--admin-text)]">Activity</h1>
        <p className="mt-1 text-sm text-[var(--admin-muted)]">The most recent 100 actions taken across the admin dashboard.</p>
      </div>

      {events.length === 0 ? (
        <EmptyState title="No activity yet" />
      ) : (
        <Card className="divide-y divide-[var(--admin-border)]">
          {events.map((event) => (
            <div key={event.id} className="flex items-start justify-between gap-4 px-4 py-3">
              <div>
                <p className="text-sm text-[var(--admin-text)]">{event.summary}</p>
                <p className="mt-0.5 text-xs text-[var(--admin-muted)]">
                  {event.actorName || event.actorEmail || "System"} · {event.action}
                </p>
              </div>
              <p className="shrink-0 text-xs text-[var(--admin-muted)]">{new Date(event.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
