import Link from "next/link";
import { requireArtistSession } from "@/lib/artist/session";
import { getArtistRowById, getPublishChecklist } from "@/lib/repositories/artistAdmin";
import { listBookingsForArtist } from "@/lib/repositories/bookings";
import { listCalendarEventsForArtist } from "@/lib/repositories/calendar";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { Card, CardBody, CardHeader } from "@/components/admin/ui/Card";
import { ArtistStatusBadge, BookingStatusBadge, CalendarEventBadge } from "@/components/admin/ui/Badge";
import { EmptyState } from "@/components/admin/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function ArtistDashboardPage() {
  const user = await requireArtistSession();
  const artist = await getArtistRowById(user.artistId);
  if (!artist) {
    return <EmptyState title="Artist profile not found" description="Contact the admin team." />;
  }

  const [bookings, events, showRows] = await Promise.all([
    listBookingsForArtist(user.artistId),
    listCalendarEventsForArtist(user.artistId),
    getDb().select().from(schema.shows).where(eq(schema.shows.artistId, user.artistId)),
  ]);

  const checklist = getPublishChecklist(artist);
  const completedCount = checklist.filter((c) => c.ok).length;

  const pendingBookings = bookings.filter((b) => b.status === "new" || b.status === "contacted" || b.status === "negotiating");
  const confirmedBookings = bookings.filter((b) => b.status === "confirmed");

  const now = new Date();
  const upcomingShows = showRows
    .filter((s) => !s.isPast)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const nextUnavailable = events
    .filter((e) => e.endAt >= now && ["booked_platform", "booked_external", "unavailable"].includes(e.type))
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-[var(--admin-text)]">{artist.stageName || artist.name}</h1>
          <ArtistStatusBadge status={artist.status} />
        </div>
        <p className="mt-1 text-sm text-[var(--admin-muted)]">/artists/{artist.slug} · Profile completeness: {completedCount}/{checklist.length}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardBody>
            <p className="text-sm text-[var(--admin-muted)]">Pending Booking Requests</p>
            <p className="mt-1 text-3xl font-semibold">{pendingBookings.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-[var(--admin-muted)]">Confirmed Bookings</p>
            <p className="mt-1 text-3xl font-semibold">{confirmedBookings.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-[var(--admin-muted)]">Upcoming Shows</p>
            <p className="mt-1 text-3xl font-semibold">{upcomingShows.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-[var(--admin-muted)]">Profile Status</p>
            <p className="mt-1 text-3xl font-semibold capitalize">{artist.status}</p>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/artist/availability" className="rounded-md border border-[var(--admin-border)] p-4 hover:bg-slate-50">
          <p className="font-medium">Manage Availability</p>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">Add an external booking or block dates.</p>
        </Link>
        <Link href="/artist/bookings" className="rounded-md border border-[var(--admin-border)] p-4 hover:bg-slate-50">
          <p className="font-medium">Review Booking Requests</p>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">See enquiries received through your public profile.</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <p className="font-medium">Pending Booking Requests</p>
            <Link href="/artist/bookings" className="text-sm text-[var(--admin-primary)] hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardBody className="space-y-3">
            {pendingBookings.length === 0 ? (
              <EmptyState title="No pending requests" />
            ) : (
              pendingBookings.slice(0, 5).map((b) => (
                <Link key={b.id} href={`/artist/bookings/${b.id}`} className="block rounded-md border border-[var(--admin-border)] p-3 hover:bg-slate-50">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{b.clientName || "Unknown"}</p>
                    <BookingStatusBadge status={b.status} />
                  </div>
                  <p className="mt-1 text-xs text-[var(--admin-muted)]">{[b.eventType, b.eventDate].filter(Boolean).join(" · ")}</p>
                </Link>
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <p className="font-medium">Upcoming Shows</p>
          </CardHeader>
          <CardBody className="space-y-3">
            {upcomingShows.length === 0 ? (
              <EmptyState title="No upcoming shows" />
            ) : (
              upcomingShows.map((s) => (
                <div key={s.id} className="rounded-md border border-[var(--admin-border)] p-3">
                  <p className="text-sm font-medium">{s.date}</p>
                  <p className="mt-1 text-xs text-[var(--admin-muted)]">{[s.venue, s.city].filter(Boolean).join(", ")}</p>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <p className="font-medium">Next Unavailable Dates</p>
            <Link href="/artist/availability" className="text-sm text-[var(--admin-primary)] hover:underline">
              Manage
            </Link>
          </CardHeader>
          <CardBody className="space-y-3">
            {nextUnavailable.length === 0 ? (
              <EmptyState title="No blocked dates" description="Your calendar is currently open." />
            ) : (
              nextUnavailable.map((e) => (
                <div key={e.id} className="rounded-md border border-[var(--admin-border)] p-3">
                  <div className="flex items-center gap-2">
                    <CalendarEventBadge type={e.type} />
                    <p className="truncate text-sm font-medium">{e.title || "Untitled"}</p>
                  </div>
                  <p className="mt-1 text-xs text-[var(--admin-muted)]">
                    {e.startAt.toLocaleDateString()} – {e.endAt.toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
