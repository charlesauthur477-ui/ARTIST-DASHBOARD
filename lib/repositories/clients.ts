import { desc, eq, ilike, inArray, isNotNull, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

// ---------------------------------------------------------------------------
// clients repository — CRM Phase 1.
//
// Clients are CRM records, not users: there is no login, no session, no
// client_users table — see lib/repositories/artistUsers.ts for the actual
// portal-login concept, which is unrelated to this. A booking's own
// clientName/email/phone/company columns (lib/repositories/bookings.ts)
// remain the authoritative historical snapshot of what was submitted at
// booking time; this repository never rewrites them.
// ---------------------------------------------------------------------------

export type ClientRow = typeof schema.clients.$inferSelect;

/** Trim + lowercase for matching only — never write this back over a booking's original snapshot. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export interface CreateClientInput {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  location?: string;
  source?: string;
  notes?: string;
}

export async function createClient(input: CreateClientInput): Promise<ClientRow> {
  const db = getDb();
  const [row] = await db
    .insert(schema.clients)
    .values({
      name: input.name?.trim() ?? "",
      email: input.email?.trim() ?? "",
      phone: input.phone?.trim() ?? "",
      company: input.company?.trim() ?? "",
      location: input.location?.trim() ?? "",
      source: input.source?.trim() ?? "",
      notes: input.notes?.trim() ?? "",
    })
    .returning();
  return row;
}

export async function getClientById(id: string): Promise<ClientRow | null> {
  const db = getDb();
  const [row] = await db.select().from(schema.clients).where(eq(schema.clients.id, id)).limit(1);
  return row ?? null;
}

/**
 * find-or-create by email — the one entry point the public booking flow
 * uses (lib/booking.ts#submitBookingInquiry). Email is a soft matching key,
 * not a unique constraint (see db/schema.ts's comment on the clients
 * table): this does a case/whitespace-insensitive exact match against any
 * existing client and reuses the first one found, rather than creating a
 * new client for every submission from the same address. An empty email
 * never matches an existing "no email on file" client and always creates a
 * new row — matching on emptiness would incorrectly merge unrelated people.
 */
export async function findOrCreateClientByEmail(email: string, defaults: CreateClientInput): Promise<ClientRow> {
  const db = getDb();
  const normalized = normalizeEmail(email);

  if (normalized) {
    const [existing] = await db
      .select()
      .from(schema.clients)
      .where(sql`lower(trim(${schema.clients.email})) = ${normalized}`)
      .limit(1);
    if (existing) return existing;
  }

  return createClient({ ...defaults, email });
}

export interface UpdateClientInput {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  location?: string;
  source?: string;
  notes?: string;
}

export async function updateClient(id: string, patch: UpdateClientInput): Promise<void> {
  const db = getDb();
  const values: Partial<typeof schema.clients.$inferInsert> = { updatedAt: new Date() };
  if (patch.name !== undefined) values.name = patch.name.trim();
  if (patch.email !== undefined) values.email = patch.email.trim();
  if (patch.phone !== undefined) values.phone = patch.phone.trim();
  if (patch.company !== undefined) values.company = patch.company.trim();
  if (patch.location !== undefined) values.location = patch.location.trim();
  if (patch.source !== undefined) values.source = patch.source.trim();
  if (patch.notes !== undefined) values.notes = patch.notes.trim();
  await db.update(schema.clients).set(values).where(eq(schema.clients.id, id));
}

export interface ClientListItem extends ClientRow {
  bookingCount: number;
  mostRecentBookingAt: Date | null;
  mostRecentBookingStatus: string | null;
}

/**
 * Admin client list — SQL-level search (ILIKE across name/email/phone/
 * company) rather than the fetch-everything-then-filter-in-JS pattern used
 * elsewhere (e.g. lib/repositories/artistAdmin.ts#listAllArtists). Booking
 * stats (count, most recent) are then computed in JS from a single
 * follow-up query scoped to just the matched clients' ids — cheap, since a
 * client's booking list is never large, and it avoids a raw SQL window
 * function for what's a simple aggregate.
 */
export async function listClientsWithStats(search?: string): Promise<ClientListItem[]> {
  const db = getDb();

  const whereClause = search
    ? or(
        ilike(schema.clients.name, `%${search}%`),
        ilike(schema.clients.email, `%${search}%`),
        ilike(schema.clients.phone, `%${search}%`),
        ilike(schema.clients.company, `%${search}%`)
      )
    : undefined;

  const clients = await db
    .select()
    .from(schema.clients)
    .where(whereClause)
    .orderBy(desc(schema.clients.updatedAt));

  if (clients.length === 0) return [];

  const clientIds = clients.map((c) => c.id);
  const relatedBookings = await db
    .select({
      clientId: schema.bookings.clientId,
      status: schema.bookings.status,
      createdAt: schema.bookings.createdAt,
    })
    .from(schema.bookings)
    .where(inArray(schema.bookings.clientId, clientIds));

  const statsByClientId = new Map<string, { count: number; mostRecentAt: Date; mostRecentStatus: string }>();
  for (const b of relatedBookings) {
    if (!b.clientId) continue;
    const existing = statsByClientId.get(b.clientId);
    if (!existing) {
      statsByClientId.set(b.clientId, { count: 1, mostRecentAt: b.createdAt, mostRecentStatus: b.status });
    } else {
      existing.count += 1;
      if (b.createdAt > existing.mostRecentAt) {
        existing.mostRecentAt = b.createdAt;
        existing.mostRecentStatus = b.status;
      }
    }
  }

  return clients.map((c) => {
    const stats = statsByClientId.get(c.id);
    return {
      ...c,
      bookingCount: stats?.count ?? 0,
      mostRecentBookingAt: stats?.mostRecentAt ?? null,
      mostRecentBookingStatus: stats?.mostRecentStatus ?? null,
    };
  });
}

export interface ClientBookingHistoryItem {
  id: string;
  status: string;
  eventType: string;
  eventDate: string;
  budgetRange: string;
  message: string;
  createdAt: Date;
  artistId: string;
  artistName: string;
  artistStageName: string;
}

export async function getClientWithBookingHistory(
  id: string
): Promise<{ client: ClientRow; bookings: ClientBookingHistoryItem[] } | null> {
  const db = getDb();
  const client = await getClientById(id);
  if (!client) return null;

  const bookingRows = await db
    .select({
      id: schema.bookings.id,
      status: schema.bookings.status,
      eventType: schema.bookings.eventType,
      eventDate: schema.bookings.eventDate,
      budgetRange: schema.bookings.budgetRange,
      message: schema.bookings.message,
      createdAt: schema.bookings.createdAt,
      artistId: schema.bookings.artistId,
      artistName: schema.artists.name,
      artistStageName: schema.artists.stageName,
    })
    .from(schema.bookings)
    .innerJoin(schema.artists, eq(schema.bookings.artistId, schema.artists.id))
    .where(eq(schema.bookings.clientId, id))
    .orderBy(desc(schema.bookings.createdAt));

  return { client, bookings: bookingRows };
}

/**
 * Total clients + "repeat" clients (linked to more than one booking) for
 * the admin dashboard — a single grouped aggregate query, not a
 * fetch-everything count, so this stays cheap regardless of table size.
 */
export async function getClientDashboardStats(): Promise<{ totalClients: number; repeatClients: number }> {
  const db = getDb();
  const [[{ count: totalClients }], repeatRows] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(schema.clients),
    db
      .select({ clientId: schema.bookings.clientId })
      .from(schema.bookings)
      .where(isNotNull(schema.bookings.clientId))
      .groupBy(schema.bookings.clientId)
      .having(sql`count(*) > 1`),
  ]);

  return { totalClients, repeatClients: repeatRows.length };
}

/** Distinct "current status" tabs derivable from bookings, for the client pipeline filter (admin/clients page). No second status system — this is purely a read-side grouping of the existing bookingStatusEnum. */
export const CLIENT_PIPELINE_STATUSES = [
  "new",
  "contacted",
  "negotiating",
  "confirmed",
  "completed",
  "rejected",
  "cancelled",
] as const;

/**
 * Filters an already-fetched client list down to clients whose
 * *most recent* booking has the given status — the client's "current
 * pipeline stage" is always derived from its bookings, never stored.
 * `"none"` matches clients with no bookings at all.
 */
export function filterClientsByPipelineStatus(
  clients: ClientListItem[],
  status: string
): ClientListItem[] {
  if (status === "none") return clients.filter((c) => c.bookingCount === 0);
  return clients.filter((c) => c.mostRecentBookingStatus === status);
}
