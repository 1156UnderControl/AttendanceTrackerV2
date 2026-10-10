# 006 — Tasks

- Spec: [spec.md](spec.md) · Database: [spec 008](../008-database-foundation/spec.md) · [ADR 0003](../../docs/adr/0003-auto-close-forgotten-sessions.md)

- [x] T1 — `/api/cron/auto-close` with a constant-time `CRON_SECRET` check; `vercel.json` cron `0 7 * * *` (AC1, AC2)
- [x] T2 — "Pedir correção" form on auto-closed sessions in Minha presença, plus request status (AC3, AC7)
- [x] T3 — Admin → Sessões: pending requests (approve/reject) and unrecorded exits without a request (AC4)
- [x] T4 — Member page: manual session, edit check-in/out (clears the 0 h credit), discard; overlaps rejected (AC5)
- [x] T5 — Admin → Auditoria: who, what, before → after, in São Paulo time with member names (AC6)
- [x] T6 — e2e tests per AC; datetime-local inputs always in São Paulo time (unit-tested)
