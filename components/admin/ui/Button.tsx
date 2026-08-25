import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-[var(--admin-primary)] text-white hover:bg-[var(--admin-primary-hover)] disabled:opacity-50",
  secondary:
    "bg-white text-[var(--admin-text)] border border-[var(--admin-border)] hover:bg-slate-50 disabled:opacity-50",
  danger: "bg-[var(--admin-danger)] text-white hover:bg-[var(--admin-danger-hover)] disabled:opacity-50",
  ghost: "text-[var(--admin-text)] hover:bg-slate-100 disabled:opacity-50",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5",
  md: "text-sm px-4 py-2",
};

export function Button({ variant = "secondary", size = "md", className, ...props }: Props) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
}
