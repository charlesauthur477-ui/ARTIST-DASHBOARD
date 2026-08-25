import type { ReactNode } from "react";

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--admin-border)] px-6 py-12 text-center">
      <p className="text-sm font-medium text-[var(--admin-text)]">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm text-[var(--admin-muted)]">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
