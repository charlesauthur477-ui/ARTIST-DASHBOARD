import { CheckCircle2, Loader2, Pencil } from "lucide-react";
import { StepShell } from "@/components/application/StepShell";
import { CheckboxField } from "@/components/application/fields/CheckboxField";
import type { StepComponentProps } from "./types";

interface ReviewStepProps extends StepComponentProps {
  onEditStep: (index: number) => void;
  onSubmit: () => void;
  status: "idle" | "submitting" | "success" | "error";
  statusMessage: string;
  referenceId?: string;
}

function SummarySection({
  title,
  stepIndex,
  onEdit,
  children,
}: {
  title: string;
  stepIndex: number;
  onEdit: (i: number) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border-subtle pb-5 last:border-none">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-medium tracking-[0.2em] text-bronze-300 uppercase">{title}</h3>
        <button
          type="button"
          onClick={() => onEdit(stepIndex)}
          className="inline-flex items-center gap-1 text-xs font-medium text-foreground/70 hover:text-bronze-300"
        >
          <Pencil className="h-3 w-3" /> Edit
        </button>
      </div>
      <div className="text-sm leading-relaxed text-foreground/85">{children}</div>
    </div>
  );
}

function Empty() {
  return <span className="text-muted">Not provided</span>;
}

export function ReviewStep({ data, update, errors, onEditStep, onSubmit, status, statusMessage, referenceId }: ReviewStepProps) {
  if (status === "success") {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-8 text-center sm:p-12">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
        <h2 className="mt-4 font-display text-2xl">Profile Submitted</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">{statusMessage}</p>
        {referenceId ? (
          <p className="mt-4 text-xs tracking-wide text-muted">
            Reference ID: <span className="font-mono text-foreground/80">{referenceId}</span>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <StepShell title="Review Your Profile" description="Please check everything below before submitting.">
      {status === "error" ? (
        <div role="alert" className="rounded-md border border-red-500/40 bg-red-500/5 px-4 py-3 text-sm text-red-300">
          {statusMessage}
        </div>
      ) : null}

      <SummarySection title="Basic Information" stepIndex={0} onEdit={onEditStep}>
        <p className="font-medium text-foreground">{data.stageName || <Empty />}</p>
        <p className="text-muted">{[data.city, data.country].filter(Boolean).join(", ") || <Empty />}</p>
        <p className="text-muted">{data.primaryGenre || <Empty />}</p>
      </SummarySection>

      <SummarySection title="Photos" stepIndex={1} onEdit={onEditStep}>
        <p>
          Profile photo: {data.profilePhoto ? data.profilePhoto.fileName : <Empty />} · Hero photo:{" "}
          {data.heroPhoto ? data.heroPhoto.fileName : <Empty />} · {data.additionalPhotos.length} additional photo
          {data.additionalPhotos.length === 1 ? "" : "s"}
        </p>
      </SummarySection>

      <SummarySection title="Music" stepIndex={2} onEdit={onEditStep}>
        <p>{data.releases.length > 0 ? `${data.releases.length} release(s) added` : <Empty />}</p>
      </SummarySection>

      <SummarySection title="Videos" stepIndex={3} onEdit={onEditStep}>
        <p>{data.videos.length > 0 ? `${data.videos.length} video(s) added` : <Empty />}</p>
      </SummarySection>

      <SummarySection title="Social Media" stepIndex={4} onEdit={onEditStep}>
        <p>
          {Object.values(data.socialLinks).filter(Boolean).length > 0
            ? `${Object.values(data.socialLinks).filter(Boolean).length} link(s) added`
            : <Empty />}
        </p>
      </SummarySection>

      <SummarySection title="Upcoming Shows" stepIndex={5} onEdit={onEditStep}>
        <p>{data.hasNoUpcomingShows ? "No upcoming public shows" : data.shows.length > 0 ? `${data.shows.length} show(s) added` : <Empty />}</p>
      </SummarySection>

      <SummarySection title="Band Members" stepIndex={6} onEdit={onEditStep}>
        <p>{data.isSoloNoBand ? "Solo performance" : data.bandMembers.length > 0 ? `${data.bandMembers.length} member(s) added` : <Empty />}</p>
      </SummarySection>

      <SummarySection title="Performance Formats" stepIndex={7} onEdit={onEditStep}>
        <p>
          {data.performanceFormats.filter((f) => f.selected).map((f) => f.label).join(", ") || <Empty />}
        </p>
      </SummarySection>

      <SummarySection title="Press / EPK" stepIndex={8} onEdit={onEditStep}>
        <p>{data.artistStatement ? "Artist statement provided" : <Empty />}</p>
      </SummarySection>

      <SummarySection title="Booking Information" stepIndex={9} onEdit={onEditStep}>
        <p>{data.preferredContactEmail || <Empty />}</p>
        <p className="text-muted">{data.availableEventTypes.join(", ") || <Empty />}</p>
      </SummarySection>

      <div className="space-y-4 pt-2">
        <CheckboxField
          checked={data.consentContentUse}
          onChange={(v) => update("consentContentUse", v)}
          error={errors.consentContentUse}
          label="I confirm that the information and media I have submitted may be used to create and promote my artist profile, press kit and booking page."
        />
        <CheckboxField
          checked={data.consentMediaRights}
          onChange={(v) => update("consentMediaRights", v)}
          error={errors.consentMediaRights}
          label="I confirm that I have permission to provide the photographs, music links and other materials submitted."
        />
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={status === "submitting"}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-bronze-400 px-6 text-sm font-semibold tracking-wide text-[#0b0a09] transition hover:bg-bronze-300 disabled:opacity-60 sm:w-auto sm:px-10"
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
          </>
        ) : (
          "Submit Artist Profile"
        )}
      </button>
    </StepShell>
  );
}
