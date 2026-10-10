# 004 — Tasks

- Spec: [spec.md](spec.md) · Math: [attendance-math.md](../../docs/architecture/attendance-math.md) · Charts: [design-system.md](../../docs/architecture/design-system.md#charts)

- [x] T1 — `/admin`: one ranking table per track for the selected week, ranked by the week's % (`rankWeekly`), links to the member page (AC1, AC2)
- [x] T2 — % color bands from `settings.color_thresholds` (AC3)
- [x] T3 — Filters in one row: season and week (list + ◀/▶); replaced the as-of date and % toggle on 2026-10-10 (AC4)
- [x] T4 — "Agora no lab" panel, refreshed every 30 s (AC5)
- [x] T5 — ~~Per-track summary~~ removed on request (AC6 dropped)
- [x] T6 — Member page charts: weekly hours vs goal, cumulative worked vs expected, with tooltips and table views (AC7)
- [x] T7 — CSV export of a track's ranking and of sessions by date range (UTF-8 BOM, `;`) (AC8)
- [x] T8 — e2e tests per AC; unit tests for the weekly series and CSV
