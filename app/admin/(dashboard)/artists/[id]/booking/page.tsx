import { notFound } from "next/navigation";
import { getArtistRowById } from "@/lib/repositories/artistAdmin";
import { BookingTabForm } from "@/components/admin/artists/BookingTabForm";
import type { Artist } from "@/types/artist";

export const dynamic = "force-dynamic";

export default async function ArtistBookingTabPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artist = await getArtistRowById(id);
  if (!artist) notFound();

  return (
    <BookingTabForm
      artistId={id}
      initialBooking={artist.bookingSettings as unknown as Artist["bookingSettings"]}
      initialContact={artist.contactInformation}
    />
  );
}
