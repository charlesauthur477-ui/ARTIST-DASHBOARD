import { clsx } from "clsx";
import type { InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const fieldBase =
  "w-full rounded-md border border-[var(--admin-border)] bg-white px-3 py-2 text-sm text-[var(--admin-text)] placeholder:text-[var(--admin-muted)] focus:border-[var(--admin-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary)] disabled:bg-slate-50 disabled:text-slate-400";

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} className={clsx("mb-1.5 block text-sm font-medium text-[var(--admin-text)]", props.className)} />;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx(fieldBase, props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={clsx(fieldBase, "min-h-24 resize-y", props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={clsx(fieldBase, props.className)} />;
}

export function FieldError({ children }: { children?: string | null }) {
  if (!children) return null;
  return <p className="mt-1 text-sm text-[var(--admin-danger)]">{children}</p>;
}

export function FieldHint({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1 text-sm text-[var(--admin-muted)]">{children}</p>;
}
