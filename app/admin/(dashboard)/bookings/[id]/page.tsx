import Link from "next/link";
import { notFound } from "next/navigation";
import { getBookingById } from "@/lib/repositories/bookings";
import { listActivityForEntity } from "@/lib/admin/activity";
import { Card, CardBody, CardHeader } from "@/components/admin/ui/Card";
import { BookingStatusBadge } from "@/components/admin/ui/Badge";
import { BookingReviewPanel } from "@/components/admin/bookings/BookingReviewPanel";

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

export default async function AdminBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = await getBookingById(id);
  if (!record) notFound();

  const { booking, artistName, artistStageName, artistSlug } = record;
  const timeline = await listActivityForEntity("booking", id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--admin-text)]">{booking.clientName || "Unknown client"}</h1>
          <div className="mt-1 flex items-center gap-2">
            <BookingStatusBadge status={booking.status} />
            <span className="text-sm text-[var(--admin-muted)]">Received {new Date(booking.createdAt).toLocaleString()}</span>
          </div>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">
            For{" "}
            <Link href={`/admin/artists/${booking.artistId}`} className="text-[var(--admin-primary)] hover:underline">
              {artistStageName || artistName}
            </Link>{" "}
            (/artists/{artistSlug})
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <p className="font-medium">Review</p>
        </CardHeader>
        <CardBody>
          <BookingReviewPanel bookingId={id} status={booking.status} internalNotes={booking.internalNotes} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <p className="font-medium">Event Details</p>
        </CardHeader>
        <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Event type" value={booking.eventType} />
          <Field label="Event date" value={booking.eventDate} />
          <Field label="Location" value={booking.location} />
          <Field label="Expected audience" value={booking.expectedAudience} />
          <Field label="Performance format" value={booking.performanceFormat} />
          <Field label="Budget range" value={booking.budgetRange} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <p className="font-medium">Client Contact</p>
        </CardHeader>
        <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Name" value={booking.clientName} />
          <Field label="Company" value={booking.company} />
          <Field label="Email" value={booking.email} />
          <Field label="Phone" value={booking.phone} />
        </CardBody>
      </Card>

      {booking.message ? (
        <Card>
          <CardHeader>
            <p className="font-medium">Message</p>
          </CardHeader>
          <CardBody>
            <p className="whitespace-pre-wrap text-sm text-[var(--admin-text)]">{booking.message}</p>
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <p className="font-medium">Timeline</p>
        </CardHeader>
        <CardBody className="space-y-3">
          {timeline.length === 0 ? (
            <p className="text-sm text-[var(--admin-muted)]">No activity recorded yet.</p>
          ) : (
            timeline.map((entry) => (
              <div key={entry.id} className="border-b border-[var(--admin-border)] pb-2 last:border-0 last:pb-0">
                <p className="text-sm text-[var(--admin-text)]">{entry.summary}</p>
                <p className="mt-0.5 text-xs text-[var(--admin-muted)]">
                  {entry.actorName || entry.actorEmail || "System"} · {new Date(entry.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </CardBody>
      </Card>
    </div>
  );
}
