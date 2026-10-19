# CRM Backfill — Optional, NOT executed

This document describes the optional one-time backfill that would link
**existing** bookings (every booking created before the CRM Phase 1 sprint)
to a `clients` record, the same way every **new** booking is linked
automatically going forward.

**This has not been run.** No existing `bookings` row has been modified by
the CRM Phase 1 sprint. Every booking created before this sprint currently
has `client_id = NULL` and will stay that way until this backfill is
explicitly approved and run.

## Why this is separate from the CRM Phase 1 sprint

CRM Phase 1 added the `clients` table and `bookings.client_id` as a purely
additive, nullable, `ON DELETE SET NULL` foreign key. Nothing about adding
that column touches existing rows. Populating `client_id` for bookings that
already existed is a **data migration** — a write to every affected
existing booking row — which is a fundamentally different kind of risk than
a schema migration, and was explicitly excluded from this sprint per the
instruction not to backfill automatically.

## What the backfill would actually do

1. Find every distinct `(lower(trim(email)))` value among bookings where
   `client_id IS NULL` and `email` is non-empty.
2. For each distinct normalized email, either reuse an existing `clients`
   row with that normalized email (if one already exists — e.g. created by
   a *new* booking submitted after this sprint shipped, from the same
   person) or create one, using the most recent booking with that email
   as the source for the client's `name`/`phone`/`company` (bookings are
   processed newest-first, so the client record reflects the most
   up-to-date contact details on file).
3. Set `client_id` on every booking matching that normalized email.
4. Bookings with a blank/empty `email` are left untouched (`client_id`
   stays `NULL`) — there's no reliable key to group them by, and guessing
   would risk merging unrelated people.

No `clientName`/`email`/`phone`/`company` snapshot column on any booking is
ever modified — the backfill only ever writes the new `client_id` column.

## How many rows would be affected

Every booking currently in the database with a non-empty `email` and
`client_id IS NULL` — i.e., every booking created before this sprint
shipped. Run this query against the live database first to get the exact
number before approving anything:

```sql
SELECT count(*) FROM bookings WHERE client_id IS NULL AND email <> '';
SELECT count(*) FILTER (WHERE email = '') FROM bookings WHERE client_id IS NULL;
```

The first number is how many booking rows would get a `client_id` set. The
second is how many would be left alone (no email to match on).

## How it would be run, if approved

1. A new one-off script, e.g. `scripts/backfill_client_ids.ts`, following
   the same shape as `scripts/migrate.ts` (pooled Neon connection, reads
   `DATABASE_URL` from `.env.local`) — **not** a `db/migrations/*.sql` file,
   since this is a data transformation, not a schema change, and doesn't
   belong in the Drizzle migration history.
2. The script would run entirely inside a single Postgres transaction, so a
   failure partway through rolls back cleanly rather than leaving some
   bookings linked and others not.
3. It should log a summary (`clients created`, `clients reused`, `bookings
   linked`, `bookings skipped (no email)`) rather than modifying anything
   silently.
4. Run manually, once, with `npx tsx --env-file=.env.local
   scripts/backfill_client_ids.ts` after explicit go-ahead — never wired
   into `npm run db:migrate` or any automatic/scheduled path.

## Risk if run

Low, but not zero — it writes to every pre-CRM booking row's `client_id`
column. The main judgment call worth making explicitly before running it:
whether grouping strictly by normalized email is the right matching rule,
or whether some bookings sharing an email are actually different people
(e.g. a venue's shared booking inbox) who shouldn't be merged into one
client record. That's a business decision, not a technical one — which is
why this stays a documented plan, not a default action.
