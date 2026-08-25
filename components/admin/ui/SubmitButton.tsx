"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/admin/ui/Button";
import type { ComponentProps } from "react";

interface Props extends Omit<ComponentProps<typeof Button>, "type"> {
  pendingLabel?: string;
}

/** A submit button that shows a pending state while its enclosing <form action={...}> is in flight. */
export function SubmitButton({ children, pendingLabel, ...props }: Props) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? (pendingLabel ?? "Saving…") : children}
    </Button>
  );
}
