#!/usr/bin/env bash
# Links the Supabase project and applies pending migrations (used by deploy.yml).
# Requires: SUPABASE_ACCESS_TOKEN, PROJECT_REF, SUPABASE_DB_PASSWORD.
set -euo pipefail

if ! pnpm exec supabase link --project-ref "$PROJECT_REF" --password "$SUPABASE_DB_PASSWORD"; then
  echo "::error title=Supabase link failed::Check SUPABASE_ACCESS_TOKEN (expired or missing permissions: Project Settings read, Migrations read/write, Connection Pooling read) and the DB password secret. See docs/runbooks/rotating-secrets.md"
  exit 1
fi

pnpm exec supabase db push --linked --password "$SUPABASE_DB_PASSWORD"
pnpm exec supabase migration list --linked --password "$SUPABASE_DB_PASSWORD"
