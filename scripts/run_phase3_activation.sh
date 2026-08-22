#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Phase 3 activation runbook.
#
# Run this from the project folder in your own Terminal (NOT through any
# Claude tool — it needs real internet access to reach Neon and Vercel Blob):
#
#   cd ~/Documents/"ARTIST DASHBOARD"/artist-dashboard
#   bash scripts/run_phase3_activation.sh
#
# Requires .env.local (already placed in this folder) with a real
# DATABASE_URL and BLOB_READ_WRITE_TOKEN, and Node.js/npm installed.
#
# Note on step order: `npm run build` runs BEFORE the standalone
# `npx tsc --noEmit` check on purpose. This project uses Next.js's typed
# routes (PageProps<...>/LayoutProps<...>), which only exist once a build
# (or `next dev`) has generated .next/types — running tsc alone on a fresh
# checkout with no prior build fails with "Cannot find name 'PageProps'"
# even though nothing is actually wrong. `next build` runs its own internal
# TypeScript check first anyway, so this order gives the real signal earlier
# and the explicit tsc step afterward is a clean redundant check.
#
# Copy the FULL terminal output and send it back — that output is what gets
# checked against every numbered verification step.
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

echo
echo "===================================================================="
echo "STEP 1 — npm install"
echo "===================================================================="
npm install

echo
echo "===================================================================="
echo "STEP 2 — npm run db:migrate"
echo "===================================================================="
npm run db:migrate

echo
echo "===================================================================="
echo "STEP 3 — npm run db:seed"
echo "===================================================================="
npm run db:seed

echo
echo "===================================================================="
echo "STEP 4 — npm run db:verify (tables, seeded artists, real application"
echo "submission, real image upload, approval flow — self-cleaning)"
echo "===================================================================="
npm run db:verify

echo
echo "===================================================================="
echo "STEP 5 — npm run lint"
echo "===================================================================="
npm run lint

echo
echo "===================================================================="
echo "STEP 6 — npm run build + smoke test WITH the database enabled"
echo "(USE_DATABASE=true — .env.local's DATABASE_URL makes this the default)"
echo "This also generates .next/types, needed for the tsc check in STEP 7."
echo "===================================================================="
npm run build
npm run start -- -p 3200 > /tmp/phase3-db-start.log 2>&1 &
SERVER_PID=$!
sleep 4
echo "-- / --"
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3200/
echo "-- /artists/aurora-noir --"
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3200/artists/aurora-noir
echo "-- /artists/nova-vale --"
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3200/artists/nova-vale
echo "-- /apply --"
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3200/apply
echo "-- content check (should print artist names) --"
curl -s http://localhost:3200/ | grep -o "Aurora Noir\|Nova Vale" | sort -u
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true

echo
echo "===================================================================="
echo "STEP 7 — npx tsc --noEmit"
echo "===================================================================="
npx tsc --noEmit

echo
echo "===================================================================="
echo "STEP 8 — npm run build + smoke test WITH USE_DATABASE=false"
echo "(confirms the static-demo-data fallback still works)"
echo "===================================================================="
USE_DATABASE=false npm run build
USE_DATABASE=false npm run start -- -p 3201 > /tmp/phase3-static-start.log 2>&1 &
SERVER_PID=$!
sleep 4
echo "-- / --"
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3201/
echo "-- /artists/aurora-noir --"
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3201/artists/aurora-noir
echo "-- /artists/nova-vale --"
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3201/artists/nova-vale
echo "-- /apply --"
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3201/apply
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true

echo
echo "===================================================================="
echo "ALL STEPS COMPLETE — copy everything above and send it back."
echo "Do NOT run git add/commit/push yet — wait for confirmation first."
echo "===================================================================="
