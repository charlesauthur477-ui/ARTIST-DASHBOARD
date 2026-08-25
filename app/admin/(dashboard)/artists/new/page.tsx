import { NewArtistForm } from "@/components/admin/artists/NewArtistForm";

export default function NewArtistPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--admin-text)]">Add Artist</h1>
        <p className="mt-1 text-sm text-[var(--admin-muted)]">Manually create a new artist profile.</p>
      </div>
      <NewArtistForm />
    </div>
  );
}
