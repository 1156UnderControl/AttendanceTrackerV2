# 003 — Seasons and phases

- Status: Implemented
- Requirements: FR-3.1 – FR-3.4
- Related ADRs: [0004](../../docs/adr/0004-per-track-season-phases.md)
- Math: [attendance-math.md](../../docs/architecture/attendance-math.md)

## Problem / motivation

The mentors define 100% attendance as the Oct–Apr season with different weekly hours per period, and the periods differ for FRC students, FTC students and mentors.

## User stories

- As an **admin**, I create a season and configure the phases for each track.
- As an **admin**, I copy last season's phases and only adjust the dates.

## Acceptance criteria

- **003-AC1**: An admin can create, edit and delete seasons (name, start, end) and mark exactly one as current.
- **003-AC2**: For a season, the UI shows three tabs: Alunos FRC, Alunos FTC, Mentores. Each has a phase table (name, start, end, h/week).
- **003-AC3**: A phase that overlaps another in the same track, or falls outside the season, is rejected with a clear message (validated in the UI and enforced by the DB).
- **003-AC4**: Each tab shows the total expected hours for the season and the expected hours to date, following attendance-math.md.
- **003-AC5**: "Copiar de…" copies phases from another track in the same season, or from the same track in the previous season (shifting dates by whole years), into an empty track.
- **003-AC6**: The attendance math functions (SQL and TS) pass all the worked examples in attendance-math.md.
- **003-AC7**: Editing phases immediately updates rankings and percentages. Nothing is stored pre-aggregated.

## Edge cases

- Gaps between phases count 0 expected hours.
- A season with no phases for a track: its % shows "—".
- Deleting a season that has sessions in it: allowed. Sessions don't reference seasons; they're matched by date.

## Out of scope

- Per-member individual goals.
