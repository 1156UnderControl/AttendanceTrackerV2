# 0004 — Configurable season phases per track

- Status: Accepted
- Date: 2026-10-09

## Context

The mentors defined 100% attendance as the Oct–Apr season, with different weekly hours by period (e.g. FRC: 8 h/week pre-season, 60 h/week build, 42 h/week competition). FTC has a different calendar, and mentors need their own goals. The boundary dates change every year (kickoff date).

## Decision

- Goals are measured per **track**: `FRC_STUDENTS`, `FTC_STUDENTS`, `MENTORS`. A student's track is their category; every mentor is in `MENTORS` regardless of category.
- Each season has an independent, admin-configurable **phase table per track** (name, start, end, h/week). Nothing is hardcoded.
- Rankings compare members only within a track.
- The formulas are in [attendance-math.md](../architecture/attendance-math.md).

## Consequences

- Admins must configure phases each season. A "copy from previous season / other track" action reduces the work.
- Adding a new track later (e.g. FLL) is an enum migration plus a UI option.

## Alternatives considered

- Hardcoded calendar months: breaks every year with the kickoff date.
- Per-category phases with mentors following their category: rejected; mentors need their own goals.
