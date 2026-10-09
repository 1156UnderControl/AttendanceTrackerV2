# 008 — Database foundation

- Status: In progress
- Requirements: FR-1.4, FR-2.x, FR-3.x, FR-4.1–4.2, FR-5.1, FR-6.x, NFR-2, NFR-5 (docs/sdd.md)
- Design: [data-model.md](../../docs/architecture/data-model.md), [attendance-math.md](../../docs/architecture/attendance-math.md), [auth-and-security.md](../../docs/architecture/auth-and-security.md)

## Problem / motivation

Every feature spec (001–006) depends on the same tables, access rules and SQL functions. Building them once, with tests, before any UI keeps the business rules in one tested place: the database.

## Scope

Migrations, RLS, grants, SQL functions, seed data, pgTAP tests, generated TypeScript types, and a TypeScript mirror of the attendance math. **No UI.** Screens are built in specs 001–006.

## Acceptance criteria

- **008-AC1**: `supabase db reset` applies every migration from scratch with no errors, and `pnpm db:types` output matches the committed `src/lib/database.types.ts`.
- **008-AC2**: Every table in `public` has RLS enabled. `anon` has no table privileges. Service-only functions (`kiosk_*`, `close_stale_sessions`) can't be executed by `anon` or `authenticated`.
- **008-AC3**: The SQL and TypeScript attendance math both pass the worked examples in attendance-math.md (this is also 003-AC6).
- **008-AC4**: The behavior the specs need is implemented and tested in SQL: kiosk toggle/checkout/present (001-AC1, AC2, AC4, AC5), invite creation/preview/redemption (002-AC1, AC5, AC6, AC10), phase constraints (003-AC3), rankings and member isolation (004-AC1, AC2, AC9; 005-AC1, AC5), auto-close and corrections (006-AC1–AC4), and the audit log (006-AC6).
- **008-AC5**: Seed data gives local development a current season with the default FRC phases and demo members with known kiosk codes.

## Out of scope

- Supabase client helpers in Next.js and all screens (specs 001–006)
- Google OAuth configuration (spec 002)
