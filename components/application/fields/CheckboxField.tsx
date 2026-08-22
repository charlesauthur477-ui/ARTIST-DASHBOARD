import { useId } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface CheckboxFieldProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  error?: string;
  className?: string;
}

export function CheckboxField({ checked, onChange, label, error, className }: CheckboxFieldProps) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="flex min-h-11 cursor-pointer items-start gap-3 text-sm text-foreground/85">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className={cn(
            "mt-0.5 h-5 w-5 flex-shrink-0 rounded border-border-subtle bg-background accent-bronze-400",
            error && "outline outline-2 outline-red-500/60"
          )}
        />
        <span className="leading-snug">{label}</span>
      </label>
      {error ? <p className="mt-1 ml-8 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
