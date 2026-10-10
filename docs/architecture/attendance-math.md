# Attendance math

This is the single source of truth for how hours, expected hours and percentages are computed. Two implementations must agree on it, and both are tested against the worked examples below:

- **SQL** (authoritative, used for rankings and stats): `supabase/migrations/20261010000300_attendance_math.sql`, tested in `supabase/tests/01_attendance_math_test.sql`
- **TypeScript** (UI-side previews and live timers): `src/lib/attendance/math.ts`, tested in `math.test.ts`

## Definitions

- **TZ** = `America/Sao_Paulo`. All dates below are local calendar dates in TZ.
- **Week** = Monday 00:00 → next Monday 00:00 (TZ).
- **Season S** = `[S.starts_on 00:00, S.ends_on + 1 day 00:00)`.
- **Track** of a member = `MENTORS` for mentors, otherwise `FRC_STUDENTS` or `FTC_STUDENTS` by category.
- **Phase P** (for a track) = an inclusive date range `[P.starts_on, P.ends_on]` with `P.weekly_hours`.

## Worked minutes

For a session `s` and a window `[a, b)`:

```text
if s.discarded:                       0
elif s.credited_minutes is not null:  s.credited_minutes, only if s.check_in ∈ [a, b), else 0
else:
  end = coalesce(s.check_out, now())          -- open sessions count live
  max(0, minutes(min(end, b) - max(s.check_in, a)))
```

- Auto-closed sessions get `credited_minutes = 0` (see ADR 0003). When a correction is approved, `check_out` is set to the corrected time and `credited_minutes` becomes `null`.
- A session crossing a window boundary (e.g. Sunday 22:00 → Monday 01:00) is split proportionally.
- **Worked(member, window)** = Σ worked minutes over the member's sessions.

## Expected minutes

For a track T, a season S and an instant `t`, with `d = local date of t`:

```text
expected_to_date(T, S, t) =
  Σ over phases P of T in S:
    elapsed_days = clamp( (d - P.starts_on) + 1, 0, P.length_days )
    P.weekly_hours × 60 × elapsed_days / 7

P.length_days = (P.ends_on - P.starts_on) + 1
expected_full_season(T, S) = Σ P.weekly_hours × 60 × P.length_days / 7
```

- The current day counts as fully elapsed. This is a simple, predictable choice that slightly favors the expectation.
- Days not covered by any phase (gaps, e.g. holidays) add 0.
- No phases → expected = 0 → % is shown as "—".

## Percentages

```text
pct_to_date = worked(member, [S.start, now)) / expected_to_date × 100
pct_season  = worked(member, S)              / expected_full_season × 100
```

- These can exceed 100%, and we don't cap them. The display rounds to an integer.
- Hours are displayed with one decimal, formatted for the viewer's locale (`12,5 h` in pt-BR, `12.5 h` in en).

## Weekly view (dashboard)

The dashboard shows one week (Monday → Sunday) at a time:

```text
at          = min(now, end of Sunday)                 -- the current week counts up to now
week_hours  = worked(member, [Monday 00:00, at))
week_goal   = expected_to_date(T, S, at) − expected_to_date(T, S, Sunday before 23:59:59)
week_pct    = week_hours / week_goal × 100            -- "—" when the goal is 0
```

So the goal of the current week covers only its elapsed days, like `expected_to_date`. The weekly ranking orders members by `week_pct`, then week hours, then name (dense rank). The season columns use `pct_to_date` at `at`.

## Ranking

Within one track, among active members only:

1. Sort by `pct_to_date` descending.
2. Break ties by season worked minutes, descending.
3. Then by name, ascending.

Equal values share a position (dense rank).

## Worked examples (also used as test fixtures)

FRC_STUDENTS phases for season 2026–2027 (example):

| Phase | Start | End | h/week | Days | Full expected |
|---|---|---|---|---|---|
| Pre-season | 2026-10-01 | 2027-01-08 | 8 | 100 | 114.29 h |
| Build | 2027-01-09 | 2027-02-28 | 60 | 51 | 437.14 h |
| Competition | 2027-03-01 | 2027-04-30 | 42 | 61 | 366.00 h |

1. **At 2026-10-07** (7 days into pre-season): expected = 8 × 7/7 = **8 h**. A student with 6 h worked → **75%**.
2. **At 2027-01-15** (all of pre-season + 7 days of build): expected = 114.29 + 60 × 7/7 = **174.29 h**.
3. **At 2026-09-20** (before any phase): expected = 0 → % = "—".
4. **Session across midnight Sunday** 2026-10-11 22:00 → 2026-10-12 01:00: 120 min in the week of Oct 5, 60 min in the week of Oct 12.
5. **Auto-closed** session 18:00 → 04:00 next day with `credited_minutes = 0`: counts 0. After a correction to 21:00, it counts 180 min.
6. **Full season FRC students** = 114.29 + 437.14 + 366.00 = **917.43 h**.
