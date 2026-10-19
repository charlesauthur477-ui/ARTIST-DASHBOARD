import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { syncConnection } from "@/lib/calendarIntegration/sync";

// ---------------------------------------------------------------------------
// Background calendar sync — Calendar Integration Phase 1, section H.
//
// This project runs on Vercel, which has no long-lived server process, so
// "automatic background synchronization" has to mean a route an external
// scheduler calls, not a setInterval anywhere in the app. This route is
// that hook: it syncs every "connected" calendar_connections row and
// returns a small summary. It does nothing on its own until something
// calls it — see CALENDAR_INTEGRATION.md for how to wire up either Vercel
// Cron (a `crons` entry in vercel.json, available even on the Hobby plan
// for daily-or-less-frequent schedules) or any external scheduler that can
// hit an HTTPS URL with a bearer token.
//
// Auth: a shared CRON_SECRET, checked against the Authorization header —
// the same convention Vercel's own Cron feature uses (it automatically
// sends `Authorization: Bearer $CRON_SECRET` when triggering a scheduled
// route). If CRON_SECRET isn't set, this route refuses every request
// rather than running unauthenticated — background sync is opt-in
// infrastructure, not something that should silently be reachable by
// anyone who finds the URL.
// ---------------------------------------------------------------------------

export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json({ error: "CRON_SECRET is not configured — background sync is disabled." }, { status: 503 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const db = getDb();
  const connections = await db.select().from(schema.calendarConnections).where(eq(schema.calendarConnections.status, "connected"));

  const results = await Promise.all(
    connections.map(async (connection) => {
      const result = await syncConnection(connection);
      return { connectionId: connection.id, provider: connection.provider, success: result.success, error: result.error };
    })
  );

  return Response.json({
    synced: results.length,
    succeeded: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success),
  });
}
