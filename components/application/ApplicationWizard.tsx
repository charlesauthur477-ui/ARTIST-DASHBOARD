"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ArtistApplication } from "@/types/application";
import { createEmptyApplication } from "@/lib/applicationDefaults";
import { submitArtistApplication } from "@/lib/application";
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

  // Offer to resume a saved draft. Draft data never leaves the browser and
  // is cleared automatically on successful submission — this is a
  // convenience for a long mobile form, not a substitute for real storage.
  useEffect(() => {
    // setState is deferred into a timeout callback (rather than called
    // directly in the effect body) so this is a response to an async check
    // of an external system (localStorage), not a synchronous cascading
    // render — see react-hooks/set-state-in-effect.
    const id = setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(DRAFT_KEY);
        if (raw) setDraftBanner(true);
      } catch {
        // localStorage unavailable (private browsing, etc.) — silently skip.
      }
      setHasHydrated(true);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!hasHydrated || status === "success") return;
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    } catch {
      // Ignore quota/availability errors — draft saving is best-effort.
    }
  }, [data, hasHydrated, status]);

  function resumeDraft() {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) setData(JSON.parse(raw));
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
    setStatus("submitting");
    const result = await submitArtistApplication(data);
    if (result.success) {
      setStatus("success");
      setStatusMessage(result.message);
      setReferenceId(result.referenceId);
      discardDraft();
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
          onEditStep={goToStep}
          onSubmit={handleSubmit}
          status={status}
          statusMessage={statusMessage}
          referenceId={referenceId}
        />
      ) : (
        <Component data={data} update={update} errors={errors} />
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
