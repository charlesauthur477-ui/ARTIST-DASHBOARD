import type { ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";

export function RepeatableCard({ children, onRemove, label }: { children: ReactNode; onRemove: () => void; label: string }) {
  return (
    <div className="relative rounded-lg border border-border-subtle p-5 sm:p-6">
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-muted hover:text-red-400"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <div className="grid gap-5 pr-10 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-dashed border-border-subtle text-sm font-medium tracking-wide text-foreground/80 transition hover:border-bronze-400/60 hover:text-bronze-300"
    >
      <Plus className="h-4 w-4" />
      {children}
    </button>
  );
}
