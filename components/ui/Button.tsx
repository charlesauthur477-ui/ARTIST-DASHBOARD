import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium tracking-wide transition duration-200 min-h-11 focus-visible:outline-2 focus-visible:outline-bronze-300 focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-bronze-400 text-[#0b0a09] hover:bg-bronze-300 active:bg-bronze-400",
  secondary:
    "border border-foreground/25 text-foreground hover:border-bronze-300/70 hover:text-bronze-200 bg-transparent",
  ghost: "text-foreground/90 hover:text-bronze-300 bg-transparent px-3 py-2",
};

interface ButtonBaseProps {
  variant?: Variant;
  className?: string;
  children: ReactNode;
  icon?: ReactNode;
}

interface ButtonAsLink extends ButtonBaseProps {
  href: string;
  external?: boolean;
}

interface ButtonAsButton extends ButtonBaseProps {
  href?: undefined;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
}

export function Button(props: ButtonAsLink | ButtonAsButton) {
  const { variant = "primary", className, children, icon } = props;
  const classes = cn(base, variants[variant], className);

  if ("href" in props && props.href) {
    const { href, external } = props;
    if (external) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
          {children}
          {icon}
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {children}
        {icon}
      </Link>
    );
  }

  const { type = "button", onClick, disabled } = props as ButtonAsButton;
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {children}
      {icon}
    </button>
  );
}
