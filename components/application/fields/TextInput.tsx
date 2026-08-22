import { useId } from "react";
import { fieldClasses } from "./fieldStyles";

interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: "text" | "email" | "tel" | "url" | "date" | "number";
  placeholder?: string;
  error?: string;
  helpText?: string;
  maxLength?: number;
}

export function TextInput({
  label,
  value,
  onChange,
  required,
  type = "text",
  placeholder,
  error,
  helpText,
  maxLength,
}: TextInputProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-foreground/85">
        {label} {required ? <span className="text-bronze-300">*</span> : null}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        className={fieldClasses(!!error)}
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
