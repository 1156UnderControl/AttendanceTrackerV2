#!/usr/bin/env bash
# Runs Supabase CLI database commands against a remote project through the
# session pooler, using only the DB password. No Management API token needed,
# because `supabase link` would require reading the project's API keys.
#
# Usage: scripts/ci/supabase-db.sh push|ping
# Requires: PROJECT_REF, SUPABASE_DB_PASSWORD, SUPABASE_POOLER_HOST
set -euo pipefail

: "${PROJECT_REF:?missing}" "${SUPABASE_DB_PASSWORD:?missing}" "${SUPABASE_POOLER_HOST:?missing}"

encoded_password=$(node -e 'process.stdout.write(encodeURIComponent(process.argv[1]))' "$SUPABASE_DB_PASSWORD")
echo "::add-mask::$encoded_password"
db_url="postgresql://postgres.${PROJECT_REF}:${encoded_password}@${SUPABASE_POOLER_HOST}:5432/postgres"

fail() {
  echo "::error title=Database connection failed::$1 See docs/runbooks/incidents.md"
  exit 1
}

case "${1:-}" in
  push)
    pnpm exec supabase db push --db-url "$db_url" ||
      fail "Migration failed, or the DB password / pooler host is wrong (\"Tenant or user not found\" = wrong host or ref)."
    pnpm exec supabase migration list --db-url "$db_url"
    ;;
  ping)
    pnpm exec supabase migration list --db-url "$db_url" ||
      fail "Could not query the database. Is the project paused, or did the DB password change?"
    ;;
  *)
    echo "usage: $0 push|ping" >&2
    exit 2
    ;;
esac
