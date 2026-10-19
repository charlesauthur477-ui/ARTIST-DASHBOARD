import Link from "next/link";
import { clsx } from "clsx";
import { requireAdmin } from "@/lib/admin/auth";
import { canManageClients } from "@/lib/admin/permissions";
import { listClientsWithStats, filterClientsByPipelineStatus, CLIENT_PIPELINE_STATUSES } from "@/lib/repositories/clients";
import { Card } from "@/components/admin/ui/Card";
import { BookingStatusBadge } from "@/components/admin/ui/Badge";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { Button } from "@/components/admin/ui/Button";
import { Input } from "@/components/admin/ui/FormField";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Admin Clients (CRM Phase 1). Same page shape as /admin/artists: a GET
// search form + status-pill tabs, backed by a real repository query rather
// than fetch-everything-then-filter. Unlike the booking/artist status tabs,
// these pills don't filter a stored status column — a client's "pipeline
// stage" is derived from its most recent booking's status (see
// filterClientsByPipelineStatus), never stored redundantly on the client
// row itself.
// ---------------------------------------------------------------------------

const PIPELINE_TABS: { label: string; value: string | undefined }[] = [
  { label: "All", value: undefined },
  ...CLIENT_PIPELINE_STATUSES.map((s) => ({ label: s[0].toUpperCase() + s.slice(1), value: s })),
  { label: "No bookings yet", value: "none" },
];

function tabHref(value: string | undefined, q: string | undefined) {
  const params = new URLSearchParams();
  if (value) params.set("status", value);
  if (q) params.set("q", q);
  const qs = params.toString();
  return qs ? `/admin/clients?${qs}` : "/admin/clients";
}

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const admin = await requireAdmin();
  const { q, status } = await searchParams;

  let clients = await listClientsWithStats(q);
  if (status) clients = filterClientsByPipelineStatus(clients, status);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--admin-text)]">Clients</h1>
        <p className="mt-1 text-sm text-[var(--admin-muted)]">
          Everyone who has submitted a booking enquiry, grouped by contact rather than by individual request.
        </p>
      </div>

      <form className="flex flex-wrap items-center gap-3" method="get">
        <Input name="q" defaultValue={q ?? ""} placeholder="Search by name, email, phone, company…" className="max-w-xs" />
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <Button type="submit" variant="secondary" size="sm">
          Search
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {PIPELINE_TABS.map((tab) => {
          const active = (status ?? undefined) === tab.value;
          return (
            <Link
              key={tab.label}
              href={tabHref(tab.value, q)}
              className={clsx(
                "rounded-full px-3 py-1.5 text-sm font-medium",
                active ? "bg-[var(--admin-primary)] text-white" : "bg-white text-slate-600 border border-[var(--admin-border)]"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {!canManageClients(admin.role) ? (
        <p className="text-sm text-[var(--admin-muted)]">You can view clients but do not have permission to edit them.</p>
      ) : null}

      {clients.length === 0 ? (
        <EmptyState
          title="No clients found"
          description="Clients are created automatically when a booking enquiry is submitted through an artist's public page."
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-[var(--admin-border)] text-xs uppercase text-[var(--admin-muted)]">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Bookings</th>
                <th className="px-4 py-3">Most recent</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-[var(--admin-border)] last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/clients/${c.id}`} className="font-medium text-[var(--admin-text)] hover:underline">
                      {c.name || "Unnamed client"}
                    </Link>
                    <p className="text-xs text-[var(--admin-muted)]">{c.email || c.phone || "No contact info"}</p>
                  </td>
                  <td className="px-4 py-3 text-[var(--admin-muted)]">{c.company || "—"}</td>
                  <td className="px-4 py-3 text-[var(--admin-muted)]">{c.source || "—"}</td>
                  <td className="px-4 py-3 text-[var(--admin-muted)]">{c.bookingCount}</td>
                  <td className="px-4 py-3 text-[var(--admin-muted)]">
                    {c.mostRecentBookingAt ? new Date(c.mostRecentBookingAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {c.mostRecentBookingStatus ? <BookingStatusBadge status={c.mostRecentBookingStatus} /> : <span className="text-[var(--admin-muted)]">—</span>}
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
