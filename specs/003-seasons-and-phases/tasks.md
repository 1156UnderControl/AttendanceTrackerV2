# 003 — Tasks

- Spec: [spec.md](spec.md) · Math: [attendance-math.md](../../docs/architecture/attendance-math.md) · [ADR 0004](../../docs/adr/0004-per-track-season-phases.md)

- [x] T1 — Admin → Temporadas: list, create, make current (AC1)
- [x] T2 — Season page: edit name/dates (refused if phases would fall outside), delete (AC1)
- [x] T3 — Tabs per track with an editable phase table; add/edit/delete phases (AC2)
- [x] T4 — Overlap and out-of-season errors: browser bounds plus database constraints (AC3)
- [x] T5 — Expected for the season and to date per track, from the SQL functions (AC4, AC7)
- [x] T6 — Copy into an empty track: from another track, from the previous season (+N years), or the FRC template (AC5)
- [x] T7 — Math worked examples in SQL and TS (AC6, done in spec 008)
- [x] T8 — e2e test covering AC1–AC5
