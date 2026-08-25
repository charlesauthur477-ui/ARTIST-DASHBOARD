import Link from "next/link";
import { getDashboardCounts, getRecentApplications, getRecentlyUpdatedArtists, getUpcomingShowsForPublishedArtists } from "@/lib/repositories/dashboard";
import { Card, CardBody, CardHeader } from "@/components/admin/ui/Card";
import { ApplicationStatusBadge, ArtistStatusBadge } from "@/components/admin/ui/Badge";
import { EmptyState } from "@/components/admin/ui/EmptyState";

export const dynamic = "force-dynamic";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardBody>
        <p className="text-sm text-[var(--admin-muted)]">{label}</p>
        <p className="mt-1 text-3xl font-semibold text-[var(--admin-text)]">{value}</p>
      </CardBody>
    </Card>
  );
}

export default async function AdminDashboardPage() {
  const [counts, recentApplications, recentArtists, upcomingShows] = await Promise.all([
    getDashboardCounts(),
    getRecentApplications(5),
    getRecentlyUpdatedArtists(5),
    getUpcomingShowsForPublishedArtists(5),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--admin-text)]">Dashboard</h1>
        <p className="mt-1 text-sm text-[var(--admin-muted)]">An overview of applications and artists on the platform.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Artists" value={counts.totalArtists} />
        <StatCard label="Published Artists" value={counts.publishedArtists} />
        <StatCard label="Draft Artists" value={counts.draftArtists} />
        <StatCard label="Pending Applications" value={counts.pendingApplications} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <p className="font-medium">Recent Applications</p>
            <Link href="/admin/applications" className="text-sm text-[var(--admin-primary)] hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardBody className="space-y-3">
            {recentApplications.length === 0 ? (
              <EmptyState title="No applications yet" />
            ) : (
              recentApplications.map((a) => (
                <Link
                  key={a.id}
                  href={`/admin/applications/${a.id}`}
                  className="block rounded-md border border-[var(--admin-border)] p-3 hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{a.stageName || "Untitled application"}</p>
                    <ApplicationStatusBadge status={a.status} />
                  </div>
                  <p className="mt-1 text-xs text-[var(--admin-muted)]">
                    {[a.primaryGenre, [a.city, a.country].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}
                  </p>
                </Link>
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <p className="font-medium">Recently Updated Artists</p>
            <Link href="/admin/artists" className="text-sm text-[var(--admin-primary)] hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardBody className="space-y-3">
            {recentArtists.length === 0 ? (
              <EmptyState title="No artists yet" />
            ) : (
              recentArtists.map((a) => (
                <Link
                  key={a.id}
                  href={`/admin/artists/${a.id}`}
                  className="block rounded-md border border-[var(--admin-border)] p-3 hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{a.stageName || a.name || "Untitled artist"}</p>
                    <ArtistStatusBadge status={a.status} />
                  </div>
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
              <EmptyState title="No upcoming shows" description="Only shown for published artists." />
            ) : (
              upcomingShows.map((s) => (
                <div key={s.id} className="rounded-md border border-[var(--admin-border)] p-3">
                  <p className="text-sm font-medium">{s.artist?.name ?? "Unknown artist"}</p>
                  <p className="mt-1 text-xs text-[var(--admin-muted)]">
                    {s.date} · {[s.venue, s.city].filter(Boolean).join(", ")}
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
