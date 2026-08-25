import { getArtistRowById } from "@/lib/repositories/artistAdmin";
import { getMediaByOwner } from "@/lib/repositories/media";
import { Card, CardBody, CardHeader } from "@/components/admin/ui/Card";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ArtistOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artist = await getArtistRowById(id);
  if (!artist) notFound();
  const media = await getMediaByOwner("artist", id);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <p className="font-medium">Summary</p>
        </CardHeader>
        <CardBody className="space-y-2 text-sm">
          <p>
            <span className="text-[var(--admin-muted)]">Genre:</span> {artist.genre || "—"}
          </p>
          <p>
            <span className="text-[var(--admin-muted)]">Location:</span> {artist.location || "—"}
          </p>
          <p>
            <span className="text-[var(--admin-muted)]">Created:</span> {new Date(artist.createdAt).toLocaleString()}
          </p>
          <p>
            <span className="text-[var(--admin-muted)]">Last updated:</span> {new Date(artist.updatedAt).toLocaleString()}
          </p>
          <p>
            <span className="text-[var(--admin-muted)]">Published:</span>{" "}
            {artist.publishedAt ? new Date(artist.publishedAt).toLocaleString() : "Not yet published"}
          </p>
          <p>
            <span className="text-[var(--admin-muted)]">Source:</span> {artist.sourceApplicationId ? "Approved application" : "Manually created"}
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <p className="font-medium">Media</p>
        </CardHeader>
        <CardBody className="text-sm text-[var(--admin-muted)]">{media.length} file{media.length === 1 ? "" : "s"} uploaded for this artist.</CardBody>
      </Card>
    </div>
  );
}
