#!/usr/bin/env bash
# Writes .env.local from the running local Supabase (`pnpm db:start` first).
# Used for local development and by the CI e2e job. Local-only values, never real secrets.
set -euo pipefail

eval "$(pnpm exec supabase status -o env 2>/dev/null)"

cat > .env.local <<ENV
NEXT_PUBLIC_SUPABASE_URL=${API_URL}
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${PUBLISHABLE_KEY}
SUPABASE_SECRET_KEY=${SECRET_KEY}
KIOSK_TOKEN=local-kiosk-token
CRON_SECRET=local-cron-secret
# Dev login with seeded accounts (ADR 0008). Never set this in Vercel.
ENABLE_DEV_LOGIN=true
ENV

echo "Wrote .env.local for ${API_URL}"
