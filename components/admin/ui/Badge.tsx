import { clsx } from "clsx";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700",
  success: "bg-green-100 text-green-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", toneClasses[tone])}>
      {children}
    </span>
  );
}

const APPLICATION_STATUS_TONE: Record<string, Tone> = {
  draft: "neutral",
  submitted: "info",
  under_review: "warning",
  approved: "success",
  rejected: "danger",
};

export function ApplicationStatusBadge({ status }: { status: string }) {
  return <Badge tone={APPLICATION_STATUS_TONE[status] ?? "neutral"}>{status.replace(/_/g, " ")}</Badge>;
}

const ARTIST_STATUS_TONE: Record<string, Tone> = {
  draft: "neutral",
  active: "success",
  inactive: "warning",
  archived: "danger",
};

export function ArtistStatusBadge({ status }: { status: string }) {
  return <Badge tone={ARTIST_STATUS_TONE[status] ?? "neutral"}>{status}</Badge>;
}
