import Link from "next/link";
import { clsx } from "clsx";
import { listAllArtists } from "@/lib/repositories/artistAdmin";
import { Card } from "@/components/admin/ui/Card";
import { ArtistStatusBadge } from "@/components/admin/ui/Badge";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { Button } from "@/components/admin/ui/Button";
import { Input } from "@/components/admin/ui/FormField";

export const dynamic = "force-dynamic";

const STATUS_TABS = [
  { label: "All", value: undefined },
  { label: "Draft", value: "draft" },
  { label: "Published", value: "active" },
  { label: "Unpublished", value: "inactive" },
  { label: "Archived", value: "archived" },
] as const;

export default async function AdminArtistsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const artists = await listAllArtists({
    status: status as "draft" | "active" | "inactive" | "archived" | undefined,
    search: q,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--admin-text)]">Artists</h1>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">Manage every artist on the platform.</p>
        </div>
        <Link href="/admin/artists/new">
          <Button variant="primary">+ Add Artist</Button>
        </Link>
      </div>

      <form className="flex flex-wrap items-center gap-3" method="get">
        <Input name="q" defaultValue={q ?? ""} placeholder="Search by name, slug, genre…" className="max-w-xs" />
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <Button type="submit" variant="secondary" size="sm">
          Search
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const href = tab.value ? `/admin/artists?status=${tab.value}${q ? `&q=${encodeURIComponent(q)}` : ""}` : `/admin/artists${q ? `?q=${encodeURIComponent(q)}` : ""}`;
          const active = (status ?? undefined) === tab.value;
          return (
            <Link
              key={tab.label}
              href={href}
              className={clsx(
                "rounded-full px-3 py-1.5 text-sm font-medium",
                active ? "bg-[var(--admin-primary)] text-white" : "bg-white text-slate-600 border border-[var(--admin-border)]"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {artists.length === 0 ? (
        <EmptyState
          title="No artists found"
          description="Try a different filter, or add a new artist manually."
          action={
            <Link href="/admin/artists/new">
              <Button variant="primary" size="sm">
                + Add Artist
              </Button>
            </Link>
          }
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-[var(--admin-border)] text-xs uppercase text-[var(--admin-muted)]">
              <tr>
                <th className="px-4 py-3">Artist</th>
                <th className="px-4 py-3">Genre</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {artists.map((artist) => (
                <tr key={artist.id} className="border-b border-[var(--admin-border)] last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/artists/${artist.id}`} className="font-medium text-[var(--admin-text)] hover:underline">
                      {artist.stageName || artist.name || "Untitled"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--admin-muted)]">{artist.genre || "—"}</td>
                  <td className="px-4 py-3 text-[var(--admin-muted)]">{artist.slug}</td>
                  <td className="px-4 py-3">
                    <ArtistStatusBadge status={artist.status} />
                  </td>
                  <td className="px-4 py-3 text-[var(--admin-muted)]">{new Date(artist.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
