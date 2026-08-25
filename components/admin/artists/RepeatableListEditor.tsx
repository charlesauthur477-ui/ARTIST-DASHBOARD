"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/admin/ui/Button";
import { ConfirmSubmitButton } from "@/components/admin/ui/ConfirmSubmitButton";

// ---------------------------------------------------------------------------
// Generic in-memory list editor for an artist's repeatable child
// collections (releases, videos, shows, band members, performance formats,
// collaborations, testimonials). Mirrors the same "hold the complete list
// in memory, replace-on-save" model as the applicant wizard's
// RepeatableList (components/application/RepeatableList.tsx) and the
// server-side replaceX() functions in lib/repositories/artistAdmin.ts.
// ---------------------------------------------------------------------------

interface Props<T> {
  items: T[];
  emptyItem: T;
  renderItem: (item: T, update: (patch: Partial<T>) => void, index: number) => React.ReactNode;
  itemLabel: (item: T, index: number) => string;
  onSave: (items: T[]) => Promise<{ error: string | null }>;
}

export function RepeatableListEditor<T>({ items: initialItems, emptyItem, renderItem, itemLabel, onSave }: Props<T>) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function update(index: number, patch: Partial<T>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function move(index: number, direction: -1 | 1) {
    setItems((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function remove(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function add() {
    setItems((prev) => [...prev, emptyItem]);
    setOpenIndex(items.length);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await onSave(items);
      if (result.error) setError(result.error);
      else setSavedAt(Date.now());
    });
  }

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="text-sm text-[var(--admin-muted)]">No items yet.</p>
      ) : (
        items.map((item, i) => (
          <div key={i} className="rounded-md border border-[var(--admin-border)]">
            <button
              type="button"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium"
            >
              <span>
                {i + 1}. {itemLabel(item, i)}
              </span>
              <span className="text-[var(--admin-muted)]">{openIndex === i ? "▲" : "▼"}</span>
            </button>
            {openIndex === i ? (
              <div className="space-y-3 border-t border-[var(--admin-border)] p-3">
                {renderItem(item, (patch) => update(i, patch), i)}
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => move(i, -1)} disabled={i === 0}>
                    Move up
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => move(i, 1)} disabled={i === items.length - 1}>
                    Move down
                  </Button>
                  <ConfirmSubmitButton
                    action={async () => remove(i)}
                    confirmTitle="Remove this item?"
                    confirmBody="It will be removed once you save this tab."
                    label="Remove"
                    variant="danger"
                  />
                </div>
              </div>
            ) : null}
          </div>
        ))
      )}

      <div className="flex items-center gap-3">
        <Button type="button" variant="secondary" size="sm" onClick={add}>
          + Add item
        </Button>
        <Button type="button" variant="primary" size="sm" onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </Button>
        {savedAt ? <span className="text-sm text-[var(--admin-success)]">Saved.</span> : null}
      </div>
      {error ? <p className="text-sm text-[var(--admin-danger)]">{error}</p> : null}
    </div>
  );
}
