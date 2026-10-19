"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/admin/auth";
import { canManageClients } from "@/lib/admin/permissions";
import { logActivity } from "@/lib/admin/activity";
import { getClientById, updateClient, type UpdateClientInput } from "@/lib/repositories/clients";

// ---------------------------------------------------------------------------
// Client (CRM) admin Server Actions — CRM Phase 1. Same conventions as
// lib/admin/artistUserActions.ts / lib/admin/bookingActions.ts: requireRole
// -> permission check -> repository call -> logActivity -> revalidatePath.
// ---------------------------------------------------------------------------

export interface ClientActionState {
  error: string | null;
  success?: boolean;
}

export async function updateClientAction(
  clientId: string,
  input: UpdateClientInput
): Promise<ClientActionState> {
  const user = await requireRole(["super_admin", "manager"]);
  if (!canManageClients(user.role)) return { error: "You do not have permission to manage clients." };

  const existing = await getClientById(clientId);
  if (!existing) return { error: "Client not found." };

  if (input.name !== undefined && !input.name.trim()) {
    return { error: "Name is required." };
  }

  await updateClient(clientId, input);

  await logActivity({
    actorAdminUserId: user.id,
    action: "client.updated",
    entityType: "client",
    entityId: clientId,
    summary: `${user.name} updated client "${input.name?.trim() || existing.name || existing.email || "Unnamed client"}".`,
  });

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${clientId}`);
  return { error: null, success: true };
}
