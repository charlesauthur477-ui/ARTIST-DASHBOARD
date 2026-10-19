import { notFound } from "next/navigation";
import { getArtistRowById } from "@/lib/repositories/artistAdmin";
import { listCalendarEventsForArtist } from "@/lib/repositories/calendar";
import { BookingTabForm } from "@/components/admin/artists/BookingTabForm";
import { AvailabilityTab } from "@/components/admin/artists/AvailabilityTab";
import { Card, CardBody, CardHeader } from "@/components/admin/ui/Card";
import type { Artist } from "@/types/artist";

export const dynamic = "force-dynamic";

export default async function ArtistBookingTabPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artist = await getArtistRowById(id);
  if (!artist) notFound();

  const events = await listCalendarEventsForArtist(id);

  return (
    <div className="space-y-6">
      <BookingTabForm
        artistId={id}
        initialBooking={artist.bookingSettings as unknown as Artist["bookingSettings"]}
        initialContact={artist.contactInformation}
      />

      <Card>
        <CardHeader>
          <p className="font-medium">Availability & Calendar</p>
        </CardHeader>
        <CardBody>
          <AvailabilityTab
            artistId={id}
            events={events.map((e) => ({
              id: e.id,
              type: e.type,
              title: e.title,
              startAt: e.startAt.toISOString(),
              endAt: e.endAt.toISOString(),
              venue: e.venue,
              city: e.city,
              country: e.country,
              eventType: e.eventType,
              notes: e.notes,
              bookingId: e.bookingId,
            }))}
          />
        </CardBody>
      </Card>
    </div>
  );
}
