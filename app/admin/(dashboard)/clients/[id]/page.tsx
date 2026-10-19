import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { canManageClients } from "@/lib/admin/permissions";
import { getClientWithBookingHistory } from "@/lib/repositories/clients";
import { Card, CardBody, CardHeader } from "@/components/admin/ui/Card";
import { BookingStatusBadge } from "@/components/admin/ui/Badge";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { ClientEditForm } from "@/components/admin/clients/ClientEditForm";

export const dynamic = "force-dynamic";

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-[var(--admin-muted)]">{label}</p>
      <p className="mt-0.5 text-sm text-[var(--admin-text)]">{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Admin Client detail (CRM Phase 1). Booking history is read-only here by
// design — clicking a booking goes to the existing /admin/bookings/[id]
// page, which remains the one place booking status/notes are managed
// (no duplicate booking-management logic on this page, per the sprint's
// explicit instruction).
// ---------------------------------------------------------------------------
export default async function AdminClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await requireAdmin();
  const result = await getClientWithBookingHistory(id);
  if (!result) notFound();

  const { client, bookings } = result;
  const canEdit = canManageClients(admin.role);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-[var(--admin-muted)]">
          <Link href="/admin/clients" className="hover:underline">
            Clients
          </Link>
          <span>/</span>
          <span>{client.name || "Unnamed client"}</span>
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-[var(--admin-text)]">{client.name || "Unnamed client"}</h1>
        <p className="mt-1 text-sm text-[var(--admin-muted)]">
          Client since {new Date(client.createdAt).toLocaleDateString()} · {bookings.length} booking{bookings.length === 1 ? "" : "s"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <p className="font-medium">Client Information</p>
        </CardHeader>
        <CardBody>
          {canEdit ? (
            <ClientEditForm
              client={{
                id: client.id,
                name: client.name,
                email: client.email,
                phone: client.phone,
                company: client.company,
                location: client.location,
                source: client.source,
                notes: client.notes,
              }}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Email" value={client.email} />
              <Field label="Phone" value={client.phone} />
              <Field label="Company" value={client.company} />
              <Field label="Location" value={client.location} />
              <Field label="Lead / source" value={client.source} />
              {client.notes ? (
                <div className="sm:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-[var(--admin-muted)]">Notes</p>
                  <p className="mt-0.5 whitespace-pre-wrap text-sm text-[var(--admin-text)]">{client.notes}</p>
                </div>
              ) : null}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <p className="font-medium">Booking History</p>
        </CardHeader>
        <CardBody className="space-y-3">
          {bookings.length === 0 ? (
            <EmptyState title="No bookings yet" description="Bookings submitted with this client's email will appear here." />
          ) : (
            bookings.map((b) => (
              <Link
                key={b.id}
                href={`/admin/bookings/${b.id}`}
                className="block rounded-md border border-[var(--admin-border)] p-3.5 hover:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[var(--admin-text)]">{b.artistStageName || b.artistName}</p>
                    <p className="truncate text-xs text-[var(--admin-muted)]">
                      {b.eventType || "Event type not specified"}
                      {b.message ? ` · ${b.message.slice(0, 80)}${b.message.length > 80 ? "…" : ""}` : ""}
                    </p>
                  </div>
                  <BookingStatusBadge status={b.status} />
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--admin-muted)]">
                  <span>{b.eventDate || "Date TBD"}</span>
                  {b.budgetRange ? <span>{b.budgetRange}</span> : null}
                  <span>Received {new Date(b.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))
          )}
        </CardBody>
      </Card>
    </div>
  );
}
