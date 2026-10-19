import { notFound } from "next/navigation";
import { requireArtistSession } from "@/lib/artist/session";
import { getBookingByIdForArtist } from "@/lib/repositories/bookings";
import { Card, CardBody, CardHeader } from "@/components/admin/ui/Card";
import { BookingStatusBadge } from "@/components/admin/ui/Badge";

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
// Artist-facing booking detail. getBookingByIdForArtist(id, user.artistId)
// IS the authorization check — a booking belonging to a different artist
// simply doesn't come back (never a 403 leaking existence; a 404, same as
// "doesn't exist"). Deliberately omits `internalNotes` and `reviewedBy` —
// admin-only fields not shown here.
// ---------------------------------------------------------------------------
export default async function ArtistPortalBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireArtistSession();
  const booking = await getBookingByIdForArtist(id, user.artistId);
  if (!booking) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--admin-text)]">{booking.clientName || "Unknown client"}</h1>
        <div className="mt-1 flex items-center gap-2">
          <BookingStatusBadge status={booking.status} />
          <span className="text-sm text-[var(--admin-muted)]">Received {new Date(booking.createdAt).toLocaleString()}</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <p className="font-medium">Event Details</p>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      <p className="text-sm text-[var(--admin-muted)]">
        Status changes are managed by the Wavelength team. Contact admin if anything here needs correcting.
      </p>
    </div>
  );
}
