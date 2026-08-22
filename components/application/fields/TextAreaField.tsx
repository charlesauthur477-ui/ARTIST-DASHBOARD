import { useId } from "react";
import { cn } from "@/lib/cn";
import { fieldClasses } from "./fieldStyles";

interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  rows?: number;
  placeholder?: string;
  error?: string;
  helpText?: string;
  maxLength?: number;
}

export function TextAreaField({
  label,
  value,
  onChange,
  required,
  rows = 4,
  placeholder,
  error,
  helpText,
  maxLength,
}: TextAreaFieldProps) {
  const id = useId();
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="block text-sm font-medium text-foreground/85">
          {label} {required ? <span className="text-bronze-300">*</span> : null}
        </label>
        {maxLength ? (
          <span className="flex-shrink-0 text-xs text-muted">
            {value.length}/{maxLength}
          </span>
        ) : null}
      </div>
      <textarea
        id={id}
        required={required}
        rows={rows}
        placeholder={placeholder}
        maxLength={maxLength}
        className={cn(fieldClasses(!!error), "min-h-24 resize-y py-3")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
      />
      {helpText && !error ? (
        <p id={`${id}-help`} className="mt-1.5 text-xs text-muted">
          {helpText}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
