export const EVENT_TYPES = [
  "Wedding",
  "Corporate",
  "Festival",
  "College",
  "Club",
  "Concert",
  "Private Event",
  "Brand Event",
  "Other",
] as const;

export type BookingEventType = (typeof EVENT_TYPES)[number];

export const PERFORMANCE_FORMAT_OPTIONS = [
  "Solo",
  "Duo",
  "Acoustic",
  "Full Band",
  "Full Concert",
] as const;

export type BookingPerformanceFormat = (typeof PERFORMANCE_FORMAT_OPTIONS)[number];

export const BUDGET_RANGES = [
  "Under $2,000",
  "$2,000 – $5,000",
  "$5,000 – $10,000",
  "$10,000 – $25,000",
  "$25,000+",
  "Prefer to discuss",
] as const;

export interface BookingInquiryInput {
  artistSlug: string;
  fullName: string;
  organization?: string;
  email: string;
  phone: string;
  eventType: BookingEventType;
  eventDate: string;
  location: string;
  expectedAudience?: string;
  performanceFormat: BookingPerformanceFormat;
  budgetRange?: string;
  message?: string;
  /** Honeypot field — should always be empty. Bots tend to fill every field. */
  companyWebsite?: string;
}

export type BookingFieldErrors = Partial<Record<keyof BookingInquiryInput, string>>;

export interface BookingSubmissionResult {
  success: boolean;
  message: string;
  referenceId?: string;
  errors?: BookingFieldErrors;
}
