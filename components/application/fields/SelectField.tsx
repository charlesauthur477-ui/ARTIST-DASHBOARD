import { useId } from "react";
import { fieldClasses } from "./fieldStyles";

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  required?: boolean;
  error?: string;
  placeholder?: string;
}

export function SelectField({ label, value, onChange, options, required, error, placeholder }: SelectFieldProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-foreground/85">
        {label} {required ? <span className="text-bronze-300">*</span> : null}
      </label>
      <select
        id={id}
        required={required}
        className={fieldClasses(!!error)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error ? <p className="mt-1.5 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
