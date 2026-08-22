import { cn } from "@/lib/cn";

export function fieldClasses(hasError?: boolean) {
  return cn(
    "min-h-12 w-full rounded-md border bg-background px-4 text-base text-foreground placeholder:text-muted/70 transition focus:outline-none focus:ring-2 focus:ring-bronze-400/60",
    hasError ? "border-red-500/60" : "border-border-subtle focus:border-bronze-400/60"
  );
}
