import { requireAdmin } from "@/lib/admin/auth";
import { canManageAvailability } from "@/lib/admin/permissions";
import { listAllArtists } from "@/lib/repositories/artistAdmin";
import { listAllCalendarEvents } from "@/lib/repositories/calendar";
import { MasterCalendarClient, type MasterEventVM, type ArtistOption } from "@/components/admin/calendar/MasterCalendarClient";

export const dynamic = "force-dynamic";

export default async function AdminCalendarPage() {
  const admin = await requireAdmin();
  const canManage = canManageAvailability(admin.role);

  const [artistRows, eventRows] = await Promise.all([
    listAllArtists(),
    listAllCalendarEvents(),
  ]);

  const artists: ArtistOption[] = artistRows.map((a) => ({
    id: a.id,
    name: a.name,
    stageName: a.stageName,
    slug: a.slug,
  }));

  const events: MasterEventVM[] = eventRows.map((e) => ({
    id: e.id,
    artistId: e.artistId,
    artistName: e.artistName,
    artistStageName: e.artistStageName,
    artistSlug: e.artistSlug,
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
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Unified Master Calendar</h1>
        <p className="mt-1 text-sm text-slate-500">
          Cross-roster scheduling, confirmed platform bookings, external performances, and artist holds.
        </p>
      </div>

      <MasterCalendarClient events={events} artists={artists} canManage={canManage} />
    </div>
  );
}
