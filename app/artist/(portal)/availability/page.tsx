import { requireArtistSession } from "@/lib/artist/session";
import { listCalendarEventsForArtist } from "@/lib/repositories/calendar";
import { Card, CardBody, CardHeader } from "@/components/admin/ui/Card";
import { ArtistAvailabilityTab } from "@/components/artist/ArtistAvailabilityTab";

export const dynamic = "force-dynamic";

export default async function ArtistPortalAvailabilityPage() {
  const user = await requireArtistSession();
  const events = await listCalendarEventsForArtist(user.artistId);

  return (
    <Card>
      <CardHeader>
        <p className="font-medium">Calendar</p>
        <p className="mt-1 text-sm text-[var(--admin-muted)]">
          Add bookings or block dates — changes here immediately affect what the public booking form will accept.
        </p>
      </CardHeader>
      <CardBody>
        <ArtistAvailabilityTab
          currentArtistUserId={user.artistUserId}
          events={events.map((e) => ({
            id: e.id,
            type: e.type,
            title: e.title,
            startAt: e.startAt.toISOString(),
            endAt: e.endAt.toISOString(),
            venue: e.venue,
            city: e.city,
            country: e.country,
            notes: e.notes,
            bookingId: e.bookingId,
            createdByArtistUserId: e.createdByArtistUserId,
          }))}
        />
      </CardBody>
    </Card>
  );
}
