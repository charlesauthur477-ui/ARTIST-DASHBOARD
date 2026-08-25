#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Phase 4 activation runbook.
#
# Run this from the project folder in your own Terminal (NOT through any
# Claude tool — same reason as Phase 3's runbook: this environment cannot
# reach Neon directly, see PHASE_3_ACTIVATION_REPORT.md):
#
#   cd ~/Documents/"ARTIST DASHBOARD"/artist-dashboard
#   bash scripts/run_phase4_activation.sh
#
# BEFORE running this:
#   1. Add AUTH_SECRET to .env.local. Generate one with:
#        npx auth secret
#      (this writes AUTH_SECRET into .env.local for you), or generate your
#      own with `openssl rand -base64 33` and paste it in manually.
#   2. Strongly recommended: take a Neon backup or open a Neon branch before
#      this runs a migration against your real, already-seeded database —
#      unlike Phase 3's first migration (empty database), this one runs
#      against live data. See PHASE_4_PLAN.md Section 15/18.
#
# Copy the FULL terminal output and send it back.
# ---------------------------------------------------------------------------
set -e

echo "===================================================================="
echo "STEP 0 — sanity checks"
echo "===================================================================="
node -v
npm -v
if [ ! -f .env.local ]; then
  echo "ERROR: .env.local not found in $(pwd). Aborting."
  exit 1
fi
if ! grep -q "^AUTH_SECRET=.\+" .env.local; then
  echo "ERROR: AUTH_SECRET is not set in .env.local. Run 'npx auth secret' first, then re-run this script."
  exit 1
fi

echo
echo "===================================================================="
echo "STEP 1 — npm install"
echo "===================================================================="
npm install

echo
echo "===================================================================="
echo "STEP 2 — npm run db:generate (should report no pending changes —"
echo "the Phase 4 migration was already generated and committed)"
echo "===================================================================="
npm run db:generate

echo
echo "===================================================================="
echo "STEP 3 — npm run db:migrate (applies the Phase 4 admin/auth/activity"
echo "tables plus the additive artists/artist_applications columns)"
echo "===================================================================="
npm run db:migrate

echo
echo "===================================================================="
echo "STEP 4 — npm run lint"
echo "===================================================================="
npm run lint

echo
echo "===================================================================="
echo "STEP 5 — npm run build (also generates .next/types for the tsc check)"
echo "===================================================================="
npm run build

echo
echo "===================================================================="
echo "STEP 6 — npx tsc --noEmit"
echo "===================================================================="
npx tsc --noEmit

echo
echo "===================================================================="
echo "STEP 7 — smoke test (starts a local server on :3200, checks routes,"
echo "then stops it)"
echo "===================================================================="
npm run start -- -p 3200 > /tmp/phase4-start.log 2>&1 &
SERVER_PID=$!
sleep 4
echo "-- / --"
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3200/
echo "-- /admin (should redirect to /admin/login, HTTP 307) --"
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3200/admin
echo "-- /admin/login --"
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3200/admin/login
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true

echo
echo "===================================================================="
echo "STEP 8 — create your first admin account (interactive)"
echo "You will be prompted for a password (min 12 characters)."
echo "===================================================================="
read -p "Email for the first super_admin account: " ADMIN_EMAIL
read -p "Display name: " ADMIN_NAME
npm run admin:create -- --email "$ADMIN_EMAIL" --name "$ADMIN_NAME" --role super_admin

echo
echo "===================================================================="
echo "ALL STEPS COMPLETE — copy everything above and send it back."
echo "Do NOT run git add/commit/push yet — wait for confirmation first."
echo "===================================================================="
