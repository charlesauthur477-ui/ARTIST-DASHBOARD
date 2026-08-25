import Image from "next/image";
import { listAllMediaWithReferences } from "@/lib/repositories/media";
import { getDb, schema } from "@/lib/db";
import { Card } from "@/components/admin/ui/Card";
import { Badge } from "@/components/admin/ui/Badge";
import { ConfirmSubmitButton } from "@/components/admin/ui/ConfirmSubmitButton";
import { deleteOrphanedMediaAction } from "@/lib/admin/mediaActions";
import { formatFileSize } from "@/lib/uploads";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  const media = await listAllMediaWithReferences();

  const db = getDb();
  const [artists, applications] = await Promise.all([
    db.select({ id: schema.artists.id, name: schema.artists.stageName }).from(schema.artists),
    db.select({ id: schema.artistApplications.id, name: schema.artistApplications.stageName }).from(schema.artistApplications),
  ]);
  const artistNames = new Map(artists.map((a) => [a.id, a.name]));
  const applicationNames = new Map(applications.map((a) => [a.id, a.name]));

  function ownerName(ownerType: string, ownerId: string) {
    const name = ownerType === "artist" ? artistNames.get(ownerId) : applicationNames.get(ownerId);
    return name || "(unknown / deleted owner)";
  }

  const orphanedCount = media.filter((m) => m.isOrphaned).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--admin-text)]">Media</h1>
        <p className="mt-1 text-sm text-[var(--admin-muted)]">
          {media.length} file{media.length === 1 ? "" : "s"} total · {orphanedCount} not currently referenced anywhere.
        </p>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-[var(--admin-border)] text-xs uppercase text-[var(--admin-muted)]">
            <tr>
              <th className="px-4 py-3">Preview</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3">Uploaded</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {media.map((m) => (
              <tr key={m.id} className="border-b border-[var(--admin-border)] last:border-0">
                <td className="px-4 py-3">
                  <div className="relative h-12 w-12 overflow-hidden rounded border border-[var(--admin-border)] bg-slate-100">
                    <Image src={m.blobUrl} alt={m.fileName} fill sizes="48px" className="object-cover" unoptimized />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{ownerName(m.ownerType, m.ownerId)}</p>
                  <p className="text-xs text-[var(--admin-muted)]">{m.ownerType}</p>
                </td>
                <td className="px-4 py-3 text-[var(--admin-muted)]">{m.role.replace(/_/g, " ")}</td>
                <td className="px-4 py-3 text-[var(--admin-muted)]">{formatFileSize(m.sizeBytes)}</td>
                <td className="px-4 py-3 text-[var(--admin-muted)]">{new Date(m.uploadedAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">{m.isOrphaned ? <Badge tone="warning">Unused</Badge> : <Badge tone="success">In use</Badge>}</td>
                <td className="px-4 py-3">
                  {m.isOrphaned ? (
                    <ConfirmSubmitButton
                      action={deleteOrphanedMediaAction}
                      confirmTitle="Delete this file?"
                      confirmBody="This permanently removes the file from storage. This cannot be undone."
                      label="Delete"
                      variant="danger"
                    >
                      <input type="hidden" name="mediaId" value={m.id} />
                    </ConfirmSubmitButton>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
