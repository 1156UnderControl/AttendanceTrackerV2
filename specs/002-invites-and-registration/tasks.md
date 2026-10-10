# 002 — Tasks

- Spec: [spec.md](spec.md) · Database: [spec 008](../008-database-foundation/spec.md) · Sign-in: [ADR 0008](../../docs/adr/0008-google-only-sign-in.md)

- [x] T1 — Supabase SSR clients, `src/proxy.ts` session refresh, `getAuth`/`requireAdmin` helpers
- [x] T2 — Google sign-in (server action + `/auth/callback`), sign-out, dev login for local/CI
- [x] T3 — `/admin/convites`: create (link shown once, copy button), list with status and redeemers, revoke (AC1, AC7)
- [x] T4 — `/convite/[token]`: preview, sign-in, profile form with category/code/language (AC2–AC6, AC10)
- [x] T5 — `/admin/membros` list with filters, edit page, admin grant/revoke (AC8, AC9)
- [x] T6 — e2e tests tagged with the AC IDs; CI e2e job runs against local Supabase
