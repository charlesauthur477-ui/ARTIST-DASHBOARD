import { getDb, schema } from "@/lib/db";

// ---------------------------------------------------------------------------
// Single, central activity/audit logging helper — PHASE_4_PLAN.md Section 9.
//
// Every admin Server Action that mutates something calls logActivity() once
// at the end of a successful mutation. Nothing else inserts into
// activity_log directly, so the vocabulary of `action` strings stays
// consistent and every mutation is auditable the same way.
// ---------------------------------------------------------------------------

export type ActivityAction =
  | "application.submitted"
  | "application.reviewed"
  | "application.approved"
  | "application.rejected"
  | "application.returned_to_review"
  | "application.notified"
  | "application.notification_failed"
  | "artist.created"
  | "artist.updated"
  | "artist.published"
  | "artist.unpublished"
  | "artist.archived"
  | "media.uploaded"
  | "media.replaced"
  | "media.removed"
  | "media.reordered"
  | "admin.signed_in"
  | "admin.created"
  | "admin.deactivated"
  | "admin.activated"
  | "admin.role_changed"
  | "admin.password_reset"
  | "booking.created"
  | "booking.status_changed"
  | "booking.notified"
  | "booking.notification_failed"
  | "availability.added"
  | "availability.updated"
  | "availability.removed"
  | "artist.portal_signed_in"
  | "artist.portal_access_created"
  | "artist.portal_access_updated"
  | "artist.portal_access_emailed"
  | "artist.portal_access_email_failed"
  | "artist.password_reset_requested"
  | "artist.password_reset_completed"
  | "client.created"
  | "client.updated";

export interface LogActivityInput {
  actorAdminUserId: string | null;
  action: ActivityAction;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
}

export async function logActivity(input: LogActivityInput): Promise<void> {
  const db = getDb();
  try {
    await db.insert(schema.activityLog).values({
      actorAdminUserId: input.actorAdminUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      summary: input.summary,
      metadata: input.metadata ?? {},
    });
  } catch (err) {
    // Activity logging must never take down the mutation it's describing —
    // log and move on.
    console.error("[activity] failed to record activity log entry", input.action, err);
  }
}

export async function listActivityForEntity(entityType: string, entityId: string, limit = 20) {
  const db = getDb();
  const { and, desc, eq } = await import("drizzle-orm");
  const rows = await db
    .select({
      id: schema.activityLog.id,
      action: schema.activityLog.action,
      summary: schema.activityLog.summary,
      metadata: schema.activityLog.metadata,
      createdAt: schema.activityLog.createdAt,
      actorName: schema.users.name,
      actorEmail: schema.users.email,
    })
    .from(schema.activityLog)
    .leftJoin(schema.users, eq(schema.activityLog.actorAdminUserId, schema.users.id))
    .where(and(eq(schema.activityLog.entityType, entityType), eq(schema.activityLog.entityId, entityId)))
    .orderBy(desc(schema.activityLog.createdAt))
    .limit(limit);
  return rows;
}

export async function listRecentActivity(limit = 20) {
  const db = getDb();
  const { desc, eq } = await import("drizzle-orm");
  const rows = await db
    .select({
      id: schema.activityLog.id,
      action: schema.activityLog.action,
      entityType: schema.activityLog.entityType,
      entityId: schema.activityLog.entityId,
      summary: schema.activityLog.summary,
      metadata: schema.activityLog.metadata,
      createdAt: schema.activityLog.createdAt,
      actorName: schema.users.name,
      actorEmail: schema.users.email,
    })
    .from(schema.activityLog)
    .leftJoin(schema.users, eq(schema.activityLog.actorAdminUserId, schema.users.id))
    .orderBy(desc(schema.activityLog.createdAt))
    .limit(limit);
  return rows;
}
