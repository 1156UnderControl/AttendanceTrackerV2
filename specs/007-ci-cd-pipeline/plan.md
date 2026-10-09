# 007 — Technical plan

- Spec: [spec.md](spec.md)

## Overview

Delivered in two milestones:

- **Milestone 1 (bootstrap, no cloud accounts needed):** the app skeleton, tooling, and the `ci.yml` workflow that runs on every PR.
- **Milestone 2 (infra):** Supabase staging/prod, Vercel, secrets, `deploy.yml`, `keepalive.yml`, `vercel.json` cron, and branch protection.

## Changes

| Area | Change | Milestone |
|---|---|---|
| App | Next.js 16 (App Router, TS strict, Tailwind 4), next-intl (cookie/Accept-Language, ADR 0006), Cache Components off (ADR 0007), `/api/health` | 1 |
| Tooling | pnpm 10 via corepack (`packageManager`), Node 22 (`.nvmrc`), ESLint, Prettier, Vitest, Playwright, markdownlint-cli2, Supabase CLI as a dev dependency | 1 |
| i18n check | `src/lib/i18n/compare-messages.ts` (keys and ICU placeholders), `scripts/check-i18n.ts`, unit test `[007-AC10]` | 1 |
| CI | `.github/workflows/ci.yml` with jobs `quality`, `db`, `e2e`, `docs` | 1 |
| Deps | `.github/dependabot.yml` (npm grouped minor/patch, actions) | 1 |
| Env | `.env.example` | 1 |
| Deploy | `deploy.yml` (migrate staging → prod → `vercel deploy --prod`), `vercel.json` (cron, `git.deploymentEnabled.main=false`) | 2 |
| Ops | `keepalive.yml` (+ optional `pg_dump` artifact) | 2 |
| GitHub | Branch protection on `main`: required checks, squash, linear history | 2 |

## Testing

| AC | How it's verified |
|---|---|
| 007-AC1 | The PR shows the 4 checks green; job timeouts ≤ 15 min |
| 007-AC2 | The Vercel bot comments a preview URL on the PR (milestone 2) |
| 007-AC3/AC4 | A merge to `main` runs `deploy.yml`; a failing migration blocks the deploy (milestone 2) |
| 007-AC5 | Run `keepalive.yml` manually (milestone 2) |
| 007-AC6 | `vercel.json` cron is listed in Vercel → Cron Jobs (milestone 2) |
| 007-AC7 | `.github/dependabot.yml` and the PR template exist |
| 007-AC8 | `.env.example` complete; `.gitignore` covers `.env*` |
| 007-AC10 | Vitest `[007-AC10]` and `pnpm i18n:check` in `quality` |

## Risks

- Hobby cron fires anywhere within the hour, which is handled in spec 006.
- `supabase start` in CI pulls Docker images (~1–2 min). Unused services are excluded with `-x`.
