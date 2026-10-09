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

## Milestone 2 — infra (needs accounts and secrets)

- [ ] T10 — Create Supabase `uc-attendance-staging` and `uc-attendance-prod` (sa-east-1), configure Auth providers
- [ ] T11 — Import the repo in Vercel; set env vars for Preview (staging) and Production (prod) (007-AC2)
- [ ] T12 — `vercel.json`: cron `0 7 * * *` → `/api/cron/auto-close` (007-AC6); disable Git production deploys (007-AC4)
- [ ] T13 — `deploy.yml`: migrate staging → prod → `vercel deploy --prod` (007-AC3)
- [ ] T14 — `keepalive.yml` weekly + manual (007-AC5); `/api/health` pings the DB
- [ ] T15 — Branch protection on `main` with required checks
- [ ] T16 — Optional: weekly `pg_dump` artifact (007-AC9)
- [ ] Docs updated, spec status → Implemented
