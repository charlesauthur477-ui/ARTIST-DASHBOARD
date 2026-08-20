"use client";

import { useId, useState, type FormEvent } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { submitBookingInquiry } from "@/lib/booking";
import {
  BUDGET_RANGES,
  EVENT_TYPES,
  type BookingFieldErrors,
  type BookingInquiryInput,
  type BookingPerformanceFormat,
} from "@/types/booking";
import type { BookingSettings } from "@/types/artist";
import { cn } from "@/lib/cn";

const PERFORMANCE_FORMAT_LABEL: Record<string, BookingPerformanceFormat> = {
  solo: "Solo",
  duo: "Duo",
  acoustic: "Acoustic",
  "full-band": "Full Band",
  "full-concert": "Full Concert",
};

const initialState: BookingInquiryInput = {
  artistSlug: "",
  fullName: "",
  organization: "",
  email: "",
  phone: "",
  eventType: "Wedding",
  eventDate: "",
  location: "",
  expectedAudience: "",
  performanceFormat: "Solo",
  budgetRange: "",
  message: "",
  companyWebsite: "",
};

function fieldClasses(hasError?: boolean) {
  return cn(
    "min-h-12 w-full rounded-md border bg-background px-4 text-base text-foreground placeholder:text-muted/70 transition focus:outline-none focus:ring-2 focus:ring-bronze-400/60",
    hasError ? "border-red-500/60" : "border-border-subtle focus:border-bronze-400/60"
  );
}

export function BookingForm({ artistSlug, artistName, settings }: { artistSlug: string; artistName: string; settings: BookingSettings }) {
  const [form, setForm] = useState<BookingInquiryInput>({ ...initialState, artistSlug });
  const [errors, setErrors] = useState<BookingFieldErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const idBase = useId();

  const eventTypes = settings.eventTypes.length > 0 ? settings.eventTypes : EVENT_TYPES;
  const formats = settings.performanceFormats.length > 0
    ? settings.performanceFormats.map((f) => PERFORMANCE_FORMAT_LABEL[f]).filter(Boolean)
    : (["Solo", "Duo", "Acoustic", "Full Band", "Full Concert"] as BookingPerformanceFormat[]);
  const budgetRanges = settings.budgetRanges.length > 0 ? settings.budgetRanges : BUDGET_RANGES;

  function update<K extends keyof BookingInquiryInput>(key: K, value: BookingInquiryInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrors({});

    const result = await submitBookingInquiry(form);

    if (result.success) {
      setStatus("success");
      setStatusMessage(result.message);
    } else {
      setStatus("error");
      setStatusMessage(result.message);
      setErrors(result.errors ?? {});
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-8 text-center sm:p-12">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
        <h3 className="mt-4 font-display text-2xl">Enquiry Sent</h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">{statusMessage}</p>
        <button
          type="button"
          onClick={() => {
            setForm({ ...initialState, artistSlug });
            setStatus("idle");
          }}
          className="mt-6 text-sm font-medium text-bronze-300 hover:text-bronze-200"
        >
          Submit another enquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {status === "error" ? (
        <div role="alert" className="rounded-md border border-red-500/40 bg-red-500/5 px-4 py-3 text-sm text-red-300">
          {statusMessage}
        </div>
      ) : null}

      {/* Honeypot field — hidden from real users, catches simple bots */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor={`${idBase}-website`}>Company Website</label>
        <input
          id={`${idBase}-website`}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.companyWebsite}
          onChange={(e) => update("companyWebsite", e.target.value)}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor={`${idBase}-fullName`} className="mb-2 block text-sm font-medium text-foreground/85">
            Full Name <span className="text-bronze-300">*</span>
          </label>
          <input
            id={`${idBase}-fullName`}
            required
            autoComplete="name"
            className={fieldClasses(!!errors.fullName)}
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? `${idBase}-fullName-error` : undefined}
          />
          {errors.fullName ? <p id={`${idBase}-fullName-error`} className="mt-1.5 text-xs text-red-400">{errors.fullName}</p> : null}
        </div>

        <div>
          <label htmlFor={`${idBase}-organization`} className="mb-2 block text-sm font-medium text-foreground/85">
            Company / Organization
          </label>
          <input
            id={`${idBase}-organization`}
            autoComplete="organization"
            className={fieldClasses()}
            value={form.organization}
            onChange={(e) => update("organization", e.target.value)}
          />
        </div>

        <div>
          <label htmlFor={`${idBase}-email`} className="mb-2 block text-sm font-medium text-foreground/85">
            Email <span className="text-bronze-300">*</span>
          </label>
          <input
            id={`${idBase}-email`}
            type="email"
            required
            autoComplete="email"
            className={fieldClasses(!!errors.email)}
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? `${idBase}-email-error` : undefined}
          />
          {errors.email ? <p id={`${idBase}-email-error`} className="mt-1.5 text-xs text-red-400">{errors.email}</p> : null}
        </div>

        <div>
          <label htmlFor={`${idBase}-phone`} className="mb-2 block text-sm font-medium text-foreground/85">
            Phone <span className="text-bronze-300">*</span>
          </label>
          <input
            id={`${idBase}-phone`}
            type="tel"
            required
            autoComplete="tel"
            className={fieldClasses(!!errors.phone)}
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? `${idBase}-phone-error` : undefined}
          />
          {errors.phone ? <p id={`${idBase}-phone-error`} className="mt-1.5 text-xs text-red-400">{errors.phone}</p> : null}
        </div>

        <div>
          <label htmlFor={`${idBase}-eventType`} className="mb-2 block text-sm font-medium text-foreground/85">
            Event Type <span className="text-bronze-300">*</span>
          </label>
          <select
            id={`${idBase}-eventType`}
            required
            className={fieldClasses(!!errors.eventType)}
            value={form.eventType}
            onChange={(e) => update("eventType", e.target.value as BookingInquiryInput["eventType"])}
          >
            {eventTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`${idBase}-eventDate`} className="mb-2 block text-sm font-medium text-foreground/85">
            Event Date <span className="text-bronze-300">*</span>
          </label>
          <input
            id={`${idBase}-eventDate`}
            type="date"
            required
            className={fieldClasses(!!errors.eventDate)}
            value={form.eventDate}
            onChange={(e) => update("eventDate", e.target.value)}
            aria-invalid={!!errors.eventDate}
            aria-describedby={errors.eventDate ? `${idBase}-eventDate-error` : undefined}
          />
          {errors.eventDate ? <p id={`${idBase}-eventDate-error`} className="mt-1.5 text-xs text-red-400">{errors.eventDate}</p> : null}
        </div>

        <div>
          <label htmlFor={`${idBase}-location`} className="mb-2 block text-sm font-medium text-foreground/85">
            Location <span className="text-bronze-300">*</span>
          </label>
          <input
            id={`${idBase}-location`}
            required
            placeholder="City, Country"
            className={fieldClasses(!!errors.location)}
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
            aria-invalid={!!errors.location}
            aria-describedby={errors.location ? `${idBase}-location-error` : undefined}
          />
          {errors.location ? <p id={`${idBase}-location-error`} className="mt-1.5 text-xs text-red-400">{errors.location}</p> : null}
        </div>

        <div>
          <label htmlFor={`${idBase}-audience`} className="mb-2 block text-sm font-medium text-foreground/85">
            Expected Audience
          </label>
          <input
            id={`${idBase}-audience`}
            inputMode="numeric"
            placeholder="e.g. 150"
            className={fieldClasses()}
            value={form.expectedAudience}
            onChange={(e) => update("expectedAudience", e.target.value)}
          />
        </div>

        <div>
          <label htmlFor={`${idBase}-format`} className="mb-2 block text-sm font-medium text-foreground/85">
            Performance Format <span className="text-bronze-300">*</span>
          </label>
          <select
            id={`${idBase}-format`}
            required
            className={fieldClasses(!!errors.performanceFormat)}
            value={form.performanceFormat}
            onChange={(e) => update("performanceFormat", e.target.value as BookingInquiryInput["performanceFormat"])}
          >
            {formats.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`${idBase}-budget`} className="mb-2 block text-sm font-medium text-foreground/85">
            Budget Range
          </label>
          <select
            id={`${idBase}-budget`}
            className={fieldClasses()}
            value={form.budgetRange}
            onChange={(e) => update("budgetRange", e.target.value)}
          >
            <option value="">Select a range</option>
            {budgetRanges.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-muted">Enquire for availability &amp; pricing — this helps us respond appropriately.</p>
        </div>
      </div>

      <div>
        <label htmlFor={`${idBase}-message`} className="mb-2 block text-sm font-medium text-foreground/85">
          Message
        </label>
        <textarea
          id={`${idBase}-message`}
          rows={5}
          placeholder="Tell us more about your event..."
          className={cn(fieldClasses(), "min-h-32 resize-y py-3")}
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-bronze-400 px-6 text-sm font-semibold tracking-wide text-[#0b0a09] transition hover:bg-bronze-300 disabled:opacity-60 sm:w-auto sm:px-10"
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Sending...
          </>
        ) : (
          `Send Booking Enquiry to ${artistName}`
        )}
      </button>
    </form>
  );
}
