"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ArtistApplication } from "@/types/application";
import { createEmptyApplication } from "@/lib/applicationDefaults";
import { createDraftApplication, submitArtistApplication } from "@/lib/application";
import { cn } from "@/lib/cn";

import { BasicInfoStep } from "./steps/BasicInfoStep";
import { PhotosStep } from "./steps/PhotosStep";
import { MusicStep } from "./steps/MusicStep";
import { VideosStep } from "./steps/VideosStep";
import { SocialsStep } from "./steps/SocialsStep";
import { ShowsStep } from "./steps/ShowsStep";
import { BandStep } from "./steps/BandStep";
import { PerformanceStep } from "./steps/PerformanceStep";
import { PressStep } from "./steps/PressStep";
import { BookingStep } from "./steps/BookingStep";
import { ReviewStep } from "./steps/ReviewStep";

const DRAFT_KEY = "wavelength-artist-application-draft-v1";

const STEP_LABELS = [
  "Basic Info",
  "Photos",
  "Music",
  "Videos",
  "Socials",
  "Shows",
  "Band",
  "Performance",
  "Press / EPK",
  "Booking",
  "Review & Submit",
] as const;

// Kept separate from STEP_LABELS (rather than one combined array) so this
// stays typed to plain StepComponentProps — ReviewStep takes extra props
// and is rendered through its own explicit branch below.
const STEP_COMPONENTS = [
  BasicInfoStep,
  PhotosStep,
  MusicStep,
  VideosStep,
  SocialsStep,
  ShowsStep,
  BandStep,
  PerformanceStep,
  PressStep,
  BookingStep,
] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateStep(index: number, data: ArtistApplication): Record<string, string> {
  const errors: Record<string, string> = {};
  if (index === 0 && data.stageName.trim().length < 2) {
    errors.stageName = "Please enter an artist / stage name.";
  }
  if (index === 1) {
    if (!data.profilePhoto) errors.profilePhoto = "A profile photo is required.";
    if (!data.heroPhoto) errors.heroPhoto = "A hero / cover photo is required.";
  }
  if (index === 9 && (!data.preferredContactEmail || !EMAIL_RE.test(data.preferredContactEmail))) {
    errors.preferredContactEmail = "Please enter a valid contact email.";
  }
  return errors;
}

export function ApplicationWizard() {
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState<ArtistApplication>(createEmptyApplication());
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [referenceId, setReferenceId] = useState<string | undefined>();
  const [draftBanner, setDraftBanner] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);
  // The database row (status: draft) every uploaded photo in this session
  // attaches to — see PHASE_3_PLAN.md Section 6. Created once on mount
  // (or restored from a saved draft) so it exists before the applicant
  // reaches the Photos step. Uploads are disabled (FileInput shows a retry
  // message) for the brief window before this resolves.
  const [applicationId, setApplicationId] = useState<string | null>(null);

  // Restore a saved draft's data + application id, or create a fresh
  // application row. Draft *data* never leaves the browser until submit;
  // the application *id* (and any photos already uploaded against it) does
  // live in the database from the moment this effect creates it — that's
  // what lets uploads be real, permanent files even before final submit.
  useEffect(() => {
    let cancelled = false;
    // The state updates below happen inside an async callback responding to
    // reads of external systems (localStorage, then the createDraftApplication
    // Server Action) rather than synchronously in the effect body itself —
    // see react-hooks/set-state-in-effect.
    (async () => {
      let existingId: string | null = null;
      try {
        const raw = window.localStorage.getItem(DRAFT_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { applicationId?: string; data?: ArtistApplication };
          if (parsed?.applicationId) {
            existingId = parsed.applicationId;
            if (!cancelled) setDraftBanner(true);
          }
        }
      } catch {
        // localStorage unavailable or corrupt — proceed as a fresh session.
      }

      if (existingId) {
        if (!cancelled) setApplicationId(existingId);
      } else {
        try {
          const newId = await createDraftApplication();
          if (!cancelled) setApplicationId(newId);
        } catch (err) {
          console.error("[application] failed to create draft application", err);
        }
      }
      if (!cancelled) setHasHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasHydrated || status === "success" || !applicationId) return;
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ applicationId, data }));
    } catch {
      // Ignore quota/availability errors — draft saving is best-effort.
    }
  }, [data, hasHydrated, status, applicationId]);

  function resumeDraft() {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { applicationId?: string; data?: ArtistApplication };
        if (parsed?.data) setData(parsed.data);
      }
    } catch {
      // Ignore corrupt draft — user just starts fresh.
    }
    setDraftBanner(false);
  }

  function discardDraft() {
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      // no-op
    }
    setDraftBanner(false);
    // The discarded draft's application row (and any photos already
    // uploaded against it) is left as-is in the database — starting over
    // gets a brand-new draft row rather than reusing one the applicant
    // explicitly walked away from.
    createDraftApplication()
      .then((id) => setApplicationId(id))
      .catch((err) => console.error("[application] failed to create draft application", err));
  }

  function update<K extends keyof ArtistApplication>(key: K, value: ArtistApplication[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key as string]: "" }));
  }

  function goNext() {
    const stepErrors = validateStep(stepIndex, data);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setStepIndex((i) => Math.min(i + 1, STEP_LABELS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setStepIndex((i) => Math.max(i - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToStep(index: number) {
    setStepIndex(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    if (!applicationId) {
      setStatus("error");
      setStatusMessage("Your application isn't ready yet — please wait a moment and try again.");
      return;
    }
    setStatus("submitting");
    const result = await submitArtistApplication(applicationId, data);
    if (result.success) {
      setStatus("success");
      setStatusMessage(result.message);
      setReferenceId(result.referenceId);
      try {
        window.localStorage.removeItem(DRAFT_KEY);
      } catch {
        // no-op
      }
    } else {
      setStatus("error");
      setStatusMessage(result.message);
      setErrors(result.errors ?? {});
    }
  }

  const isReview = stepIndex === STEP_LABELS.length - 1;
  const Component = STEP_COMPONENTS[stepIndex];
  const progressPercent = Math.round(((stepIndex + 1) / STEP_LABELS.length) * 100);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-32 sm:px-6">
      {draftBanner ? (
        <div className="mb-6 flex flex-col gap-3 rounded-md border border-bronze-400/40 bg-bronze-400/5 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-foreground/85">We found a saved draft from a previous session.</p>
          <div className="flex gap-3">
            <button type="button" onClick={resumeDraft} className="font-medium text-bronze-300 hover:text-bronze-200">
              Resume draft
            </button>
            <button type="button" onClick={discardDraft} className="text-muted hover:text-foreground/80">
              Start over
            </button>
          </div>
        </div>
      ) : null}

      {status !== "success" ? (
        <div className="sticky top-16 z-30 -mx-4 mb-8 bg-background/95 px-4 pb-4 pt-4 backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:top-20 sm:-mx-6 sm:px-6">
          <div className="flex items-center justify-between text-xs font-medium tracking-[0.15em] text-muted uppercase">
            <span>
              Step {stepIndex + 1} of {STEP_LABELS.length}
            </span>
            <span className="hidden sm:inline">{STEP_LABELS[stepIndex]}</span>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-border-subtle">
            <div
              className="h-full rounded-full bg-bronze-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      ) : null}

      {isReview ? (
        <ReviewStep
          data={data}
          update={update}
          errors={errors}
          applicationId={applicationId}
          onEditStep={goToStep}
          onSubmit={handleSubmit}
          status={status}
          statusMessage={statusMessage}
          referenceId={referenceId}
        />
      ) : (
        <Component data={data} update={update} errors={errors} applicationId={applicationId} />
      )}

      {status !== "success" && !isReview ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:px-6">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <button
              type="button"
              onClick={goBack}
              disabled={stepIndex === 0}
              className={cn(
                "inline-flex min-h-12 items-center gap-1.5 rounded-full border border-border-subtle px-5 text-sm font-medium text-foreground/80 transition hover:border-bronze-400/60 hover:text-bronze-300 disabled:opacity-0"
              )}
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <button
              type="button"
              onClick={goNext}
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-full bg-bronze-400 px-6 text-sm font-semibold tracking-wide text-[#0b0a09] transition hover:bg-bronze-300 sm:flex-none sm:px-10"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      {status !== "success" && isReview ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex min-h-12 items-center gap-1.5 rounded-full border border-border-subtle px-5 text-sm font-medium text-foreground/80 transition hover:border-bronze-400/60 hover:text-bronze-300"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
