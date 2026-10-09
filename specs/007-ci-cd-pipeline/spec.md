# 007 — CI/CD pipeline

- Status: In progress
- Requirements: FR-7.1 – FR-7.3
- Architecture: [ci-cd.md](../../docs/architecture/ci-cd.md)

## Acceptance criteria

- **007-AC1**: On every PR, `ci.yml` runs the `quality`, `db`, `e2e` and `docs` jobs, all required by branch protection. Total time is under 10 min, and pnpm and Playwright browsers are cached.
- **007-AC2**: Every PR gets a Vercel Preview URL connected to the staging Supabase project, and the URL is posted on the PR.
- **007-AC3**: On merge to `main`, after CI passes, `deploy.yml` runs `supabase db push` on staging, then on prod, then `vercel deploy --prod`. If any step fails, production isn't deployed.
- **007-AC4**: Vercel's automatic production deploys from Git are disabled. Prod deploys only via `deploy.yml`.
- **007-AC5**: `keepalive.yml` runs weekly and on demand, hits `/api/health` on staging and prod, and fails visibly if either is down.
- **007-AC6**: Vercel Cron is configured in `vercel.json` to call `/api/cron/auto-close` daily at 07:00 UTC (04:00 BRT).
- **007-AC7**: Dependabot is enabled for npm and GitHub Actions. The PR template has the SDD checklist.
- **007-AC8**: No secret is in the repo. `.env.example` lists every variable with a description.
- **007-AC9** (optional): A weekly `pg_dump` of prod is uploaded as an Actions artifact with 90-day retention.
- **007-AC10**: The `quality` job fails if `messages/en.json` (or any other locale) is missing a key from `messages/pt-BR.json` or has extra keys, and if the typecheck finds an unknown message key.

## Out of scope

- Paid features: Vercel Pro, Supabase branching, or point-in-time recovery.
