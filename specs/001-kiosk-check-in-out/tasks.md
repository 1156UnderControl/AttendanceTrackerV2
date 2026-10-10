# 001 — Tasks

- Spec: [spec.md](spec.md) · Database: [spec 008](../008-database-foundation/spec.md) · Design: [design-system.md](../../docs/architecture/design-system.md#kiosk-spec-001)

- [x] T1 — Service client (secret key, server only) and the kiosk device cookie check (ADR 0005)
- [x] T2 — `/kiosk/unlock` for admins: activate or deactivate, default language (AC7, AC10)
- [x] T3 — `/kiosk` full screen: locked state (AC6), code entry with digits only, refocus (AC1, AC2, AC4, AC8)
- [x] T4 — Present grid with live elapsed time, confirm dialog, 30 s refresh, name filter above 20 people (AC3, AC8)
- [x] T5 — Greetings in the member's language; PT/EN toggle (AC10)
- [x] T6 — Offline message that keeps the code (AC9)
- [x] T7 — V1 look: 3D code box, pixel "BATER PONTO" button, floating bubbles (AC11)
- [x] T8 — e2e tests per AC (AC5 is covered by pgTAP `02_kiosk_test.sql`)
