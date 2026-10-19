import Link from "next/link";
import { clsx } from "clsx";
import { listBookings, type BookingStatus } from "@/lib/repositories/bookings";
import { Card } from "@/components/admin/ui/Card";
import { BookingStatusBadge } from "@/components/admin/ui/Badge";
import { EmptyState } from "@/components/admin/ui/EmptyState";

export const dynamic = "force-dynamic";

const STATUS_TABS: { label: string; value: BookingStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Negotiating", value: "negotiating" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Rejected", value: "rejected" },
  { label: "Cancelled", value: "cancelled" },
];

export default async function AdminBookingsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const activeStatus = (STATUS_TABS.find((t) => t.value === status)?.value ?? "all") as BookingStatus | "all";

  const bookings = await listBookings(activeStatus === "all" ? undefined : activeStatus);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--admin-text)]">Bookings</h1>
        <p className="mt-1 text-sm text-[var(--admin-muted)]">Booking enquiries submitted through artists&rsquo; public &ldquo;Book This Artist&rdquo; forms.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value === "all" ? "/admin/bookings" : `/admin/bookings?status=${tab.value}`}
            className={clsx(
              "rounded-full px-3 py-1.5 text-sm font-medium",
              activeStatus === tab.value ? "bg-[var(--admin-primary)] text-white" : "bg-white text-slate-600 border border-[var(--admin-border)]"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {bookings.length === 0 ? (
        <EmptyState title="No bookings" description="No booking requests match this filter." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-[var(--admin-border)] text-xs uppercase text-[var(--admin-muted)]">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Artist</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Received</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b border-[var(--admin-border)] last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/bookings/${b.id}`} className="font-medium text-[var(--admin-text)] hover:underline">
                      {b.clientName || "Unknown"}
                    </Link>
                    {b.company ? <p className="text-xs text-[var(--admin-muted)]">{b.company}</p> : null}
                  </td>
                  <td className="px-4 py-3 text-[var(--admin-muted)]">{b.artistStageName || b.artistName}</td>
                  <td className="px-4 py-3 text-[var(--admin-muted)]">{b.eventType || "—"}</td>
                  <td className="px-4 py-3 text-[var(--admin-muted)]">{b.eventDate || "—"}</td>
                  <td className="px-4 py-3 text-[var(--admin-muted)]">{new Date(b.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <BookingStatusBadge status={b.status} />
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
