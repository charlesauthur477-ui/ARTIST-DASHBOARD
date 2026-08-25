import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getArtistRowById } from "@/lib/repositories/artistAdmin";
import { ArtistStatusBadge } from "@/components/admin/ui/Badge";
import { ArtistEditorTabs } from "@/components/admin/artists/ArtistEditorTabs";
import { Button } from "@/components/admin/ui/Button";

export default async function ArtistEditorLayout({ children, params }: { children: ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artist = await getArtistRowById(id);
  if (!artist) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-[var(--admin-text)]">{artist.stageName || artist.name || "Untitled artist"}</h1>
            <ArtistStatusBadge status={artist.status} />
          </div>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">/artists/{artist.slug}</p>
        </div>
        <a href={`/admin/artists/${artist.id}/preview`} target="_blank" rel="noreferrer">
          <Button variant="secondary" size="sm">
            Preview
          </Button>
        </a>
      </div>

      <ArtistEditorTabs artistId={artist.id} />

      <div>{children}</div>

      <Link href="/admin/artists" className="inline-block text-sm text-[var(--admin-muted)] hover:underline">
        ← Back to all artists
      </Link>
    </div>
  );
}
