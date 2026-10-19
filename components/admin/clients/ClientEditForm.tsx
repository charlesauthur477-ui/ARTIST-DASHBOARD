"use client";

import { useActionState } from "react";
import { updateClientAction, type ClientActionState } from "@/lib/admin/clientActions";
import { Input, Label, Textarea, FieldError } from "@/components/admin/ui/FormField";
import { SubmitButton } from "@/components/admin/ui/SubmitButton";

const initialState: ClientActionState = { error: null };

// ---------------------------------------------------------------------------
// Admin Client detail → edit form. Same useActionState + Server Action
// pattern as PortalAccessCard.tsx. Bound to updateClientAction, which
// requires super_admin/manager and logs a "client.updated" activity entry —
// this component itself has no permission logic; the page decides whether
// to render it at all (see app/admin/(dashboard)/clients/[id]/page.tsx).
// ---------------------------------------------------------------------------

export interface ClientEditFormValues {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  location: string;
  source: string;
  notes: string;
}

export function ClientEditForm({ client }: { client: ClientEditFormValues }) {
  const [state, formAction] = useActionState(async (_prev: ClientActionState, formData: FormData) => {
    return updateClientAction(client.id, {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      company: String(formData.get("company") ?? ""),
      location: String(formData.get("location") ?? ""),
      source: String(formData.get("source") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    });
  }, initialState);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={client.name} required />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" defaultValue={client.email} />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" defaultValue={client.phone} />
      </div>
      <div>
        <Label htmlFor="company">Company</Label>
        <Input id="company" name="company" defaultValue={client.company} />
      </div>
      <div>
        <Label htmlFor="location">Location</Label>
        <Input id="location" name="location" defaultValue={client.location} />
      </div>
      <div>
        <Label htmlFor="source">Lead / source</Label>
        <Input id="source" name="source" defaultValue={client.source} placeholder="e.g. referral, Instagram, repeat client" />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={client.notes} rows={4} />
      </div>
      <div className="sm:col-span-2 flex items-center gap-3">
        <SubmitButton variant="primary" size="sm" pendingLabel="Saving…">
          Save changes
        </SubmitButton>
        {state.success ? <p className="text-sm text-emerald-600">Saved.</p> : null}
        <FieldError>{state.error}</FieldError>
      </div>
    </form>
  );
}
