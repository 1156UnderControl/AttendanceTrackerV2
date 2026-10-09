# 0001 — Next.js + Vercel + Supabase on free tiers

- Status: Accepted
- Date: 2026-10-09

## Context

V1 was Flask + MySQL on PythonAnywhere, with manual deploys. The team wants a TypeScript stack, zero cost, and automated delivery.

## Decision

- **Next.js (App Router) + TypeScript** deployed on **Vercel Hobby**.
- **Supabase Free** for Postgres and Auth, with Row Level Security as the main authorization mechanism.
- Schema managed by Supabase CLI SQL migrations. `supabase-js` with generated types (no ORM).
- GitHub Actions for CI and gated production deploys.

## Consequences

- One codebase serves the kiosk, member and admin UIs. Server actions avoid a separate API.
- Free-tier limits: Supabase pauses after 7 days idle (needs a keep-alive), 2 projects max (staging + prod), 500 MB DB (ample). Vercel Hobby cron runs at most daily, and Hobby is for non-commercial use (fine for a school team).
- No ORM means SQL lives in migrations and functions, so it is reviewed as code and tested with pgTAP.

## Alternatives considered

- Drizzle/Prisma ORM: adds a second schema source of truth next to Supabase migrations and RLS.
- Keeping MySQL or PlanetScale: no free tier with auth, and no RLS.
