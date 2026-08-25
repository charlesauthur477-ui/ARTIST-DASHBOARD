import { notFound } from "next/navigation";
import Image from "next/image";
import { getApplicationById } from "@/lib/repositories/applications";
import { getMediaByOwner } from "@/lib/repositories/media";
import { Card, CardBody, CardHeader } from "@/components/admin/ui/Card";
import { ApplicationStatusBadge } from "@/components/admin/ui/Badge";
import { ApplicationReviewPanel } from "@/components/admin/applications/ApplicationReviewPanel";

export const dynamic = "force-dynamic";

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-[var(--admin-muted)]">{label}</p>
      <p className="mt-0.5 text-sm text-[var(--admin-text)]">{value}</p>
    </div>
  );
}

export default async function AdminApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = await getApplicationById(id);
  if (!record) notFound();

  const { application, releases, videos, shows, bandMembers, collaborations, testimonials, pressQuotes } = record;
  const media = await getMediaByOwner("application", id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--admin-text)]">
            {application.stageName || application.realName || "Untitled application"}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <ApplicationStatusBadge status={application.status} />
            <span className="text-sm text-[var(--admin-muted)]">
              Submitted {application.submittedAt ? new Date(application.submittedAt).toLocaleString() : "—"}
            </span>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <p className="font-medium">Review</p>
        </CardHeader>
        <CardBody>
          <ApplicationReviewPanel applicationId={id} status={application.status} suggestedSlug={application.stageName} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <p className="font-medium">Basic Information</p>
        </CardHeader>
        <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Stage name" value={application.stageName} />
          <Field label="Real name" value={application.realName} />
          <Field label="Pronunciation" value={application.pronunciation} />
          <Field label="City" value={application.city} />
          <Field label="Country" value={application.country} />
          <Field label="Primary genre" value={application.primaryGenre} />
          <Field label="Secondary genres" value={application.secondaryGenres} />
          <Field label="Tagline" value={application.tagline} />
        </CardBody>
      </Card>

      {(application.shortBio || application.fullBio) && (
        <Card>
          <CardHeader>
            <p className="font-medium">Bio</p>
          </CardHeader>
          <CardBody className="space-y-3">
            {application.shortBio ? <p className="text-sm text-[var(--admin-text)]">{application.shortBio}</p> : null}
            {application.fullBio ? (
              <p className="whitespace-pre-line text-sm text-[var(--admin-muted)]">{application.fullBio}</p>
            ) : null}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <p className="font-medium">Artist Profile</p>
        </CardHeader>
        <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Artist type" value={application.artistType} />
          <Field label="Primary role" value={application.primaryRole} />
          <Field label="Years active" value={application.yearsActive} />
          <Field label="Languages performed" value={application.languagesPerformed} />
          <Field label="Career highlights" value={application.careerHighlights} />
          <Field label="Awards" value={application.awards} />
          <Field label="Notable performances" value={application.notablePerformances} />
          <Field label="Festivals played" value={application.festivalsPlayed} />
          <Field label="Media features" value={application.mediaFeatures} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <p className="font-medium">Technical & Booking</p>
        </CardHeader>
        <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Typical set duration" value={application.typicalSetDuration} />
          <Field label="Number of sets" value={application.numberOfSets} />
          <Field label="Technical requirements" value={application.technicalRequirements} />
          <Field label="Stage requirements" value={application.stageRequirements} />
          <Field label="Budget range" value={application.budgetRange} />
          <Field label="Preferred contact email" value={application.preferredContactEmail} />
          <Field label="Booking contact" value={application.bookingContactName} />
          <Field label="Booking email" value={application.bookingContactEmail} />
          <Field label="Booking phone" value={application.bookingPhone} />
          <Field label="Management email" value={application.managementEmail} />
          <Field label="Domestic travel" value={application.domesticTravel ? "Yes" : "No"} />
          <Field label="International travel" value={application.internationalTravel ? "Yes" : "No"} />
        </CardBody>
      </Card>

      {(application.artistStatement || application.pressKitUrl || application.websiteUrl) && (
        <Card>
          <CardHeader>
            <p className="font-medium">Press / EPK</p>
          </CardHeader>
          <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Website" value={application.websiteUrl} />
            <Field label="Press kit URL" value={application.pressKitUrl} />
            {application.artistStatement ? (
              <div className="col-span-full">
                <p className="text-xs uppercase tracking-wide text-[var(--admin-muted)]">Artist statement</p>
                <p className="mt-0.5 whitespace-pre-line text-sm text-[var(--admin-text)]">{application.artistStatement}</p>
              </div>
            ) : null}
          </CardBody>
        </Card>
      )}

      {media.length > 0 ? (
        <Card>
          <CardHeader>
            <p className="font-medium">Photos ({media.length})</p>
          </CardHeader>
          <CardBody className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {media.map((m) => (
              <div key={m.id} className="overflow-hidden rounded-md border border-[var(--admin-border)]">
                <div className="relative aspect-square bg-slate-100">
                  <Image src={m.blobUrl} alt={m.fileName} fill sizes="200px" className="object-cover" unoptimized />
                </div>
                <p className="truncate px-2 py-1 text-xs text-[var(--admin-muted)]">{m.role.replace(/_/g, " ")}</p>
              </div>
            ))}
          </CardBody>
        </Card>
      ) : null}

      {releases.length > 0 ? (
        <Card>
          <CardHeader>
            <p className="font-medium">Releases ({releases.length})</p>
          </CardHeader>
          <CardBody className="space-y-2">
            {releases.map((r) => (
              <div key={r.id} className="rounded-md border border-[var(--admin-border)] p-3 text-sm">
                <p className="font-medium">
                  {r.title} <span className="text-[var(--admin-muted)]">({r.type})</span>
                </p>
                <p className="text-[var(--admin-muted)]">{r.releaseDate}</p>
              </div>
            ))}
          </CardBody>
        </Card>
      ) : null}

      {shows.length > 0 ? (
        <Card>
          <CardHeader>
            <p className="font-medium">Shows ({shows.length})</p>
          </CardHeader>
          <CardBody className="space-y-2">
            {shows.map((s) => (
              <div key={s.id} className="rounded-md border border-[var(--admin-border)] p-3 text-sm">
                <p className="font-medium">
                  {s.date} — {s.venue}, {s.city}
                </p>
                <p className="text-[var(--admin-muted)]">{s.eventName} · {s.eventType}</p>
              </div>
            ))}
          </CardBody>
        </Card>
      ) : null}

      {bandMembers.length > 0 ? (
        <Card>
          <CardHeader>
            <p className="font-medium">Band Members ({bandMembers.length})</p>
          </CardHeader>
          <CardBody className="space-y-2">
            {bandMembers.map((m) => (
              <div key={m.id} className="rounded-md border border-[var(--admin-border)] p-3 text-sm">
                <p className="font-medium">
                  {m.name} <span className="text-[var(--admin-muted)]">— {m.role}</span>
                </p>
              </div>
            ))}
          </CardBody>
        </Card>
      ) : null}

      {videos.length > 0 || collaborations.length > 0 || testimonials.length > 0 || pressQuotes.length > 0 ? (
        <Card>
          <CardHeader>
            <p className="font-medium">Other Content</p>
          </CardHeader>
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Videos" value={videos.length || null} />
            <Field label="Collaborations" value={collaborations.length || null} />
            <Field label="Testimonials" value={testimonials.length || null} />
            <Field label="Press quotes" value={pressQuotes.length || null} />
          </CardBody>
        </Card>
      ) : null}

      {application.rejectionReason ? (
        <Card>
          <CardHeader>
            <p className="font-medium">Rejection Reason</p>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-[var(--admin-text)]">{application.rejectionReason}</p>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
