# 007 — Tasks

- Spec: [spec.md](spec.md) · Plan: [plan.md](plan.md)

## Milestone 1 — bootstrap

- [x] T1 — Scaffold Next.js 16 + TS + Tailwind; pnpm via `packageManager`; Node 22 `.nvmrc`
- [x] T2 — next-intl without locale routing: `src/i18n/{config,request}.ts`, `messages/{pt-BR,en}.json`, language switcher, typed messages (ADR 0006)
- [x] T3 — ADR 0007: Cache Components off
- [x] T4 — Vitest + unit tests for locale resolution and message comparison (007-AC10)
- [x] T5 — Playwright + smoke e2e (pt-BR default, Accept-Language, switcher, health)
- [x] T6 — Prettier, markdownlint-cli2 (docs fixed to pass), `i18n:check` script
- [x] T7 — `supabase init` (config only; migrations come in milestone 3)
- [x] T8 — `ci.yml` with `quality`, `db`, `e2e`, `docs` (007-AC1)
- [x] T9 — Dependabot + PR template (007-AC7), `.env.example` (007-AC8)

## Milestone 2 — infra

- [x] T10 — Supabase `uc-attendance-staging` / `uc-attendance-prod` (sa-east-1), Email auth with confirmation off, scoped access token
- [x] T11 — Vercel project in the Under Control team; Production/Preview env vars (007-AC2)
- [x] T12 — `vercel.json` disables Git production deploys (007-AC4). The cron entry moves to spec 006 (007-AC6).
- [x] T13 — `deploy.yml`: migrate staging → prod → `vercel build`/`deploy --prebuilt --prod` → smoke test (007-AC3)
- [x] T14 — `keepalive.yml` weekly + manual (007-AC5); `/api/health` pings Supabase Auth
- [x] T15 — GitHub: secrets, `PRODUCTION_URL` variable, `production` environment, squash-only merges, branch protection
- [x] T16 — Env vars renamed to Supabase's publishable/secret key names; runbooks for setup and secret rotation
- [ ] T17 — Optional: weekly age-encrypted DB dump (007-AC9)
- [ ] T18 — Staging Supabase redirect URL wildcard (after the first preview URL exists)
- [ ] Spec status → Implemented (after T17 decision and the first successful Deploy run)
