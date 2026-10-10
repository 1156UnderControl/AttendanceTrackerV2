# 004 — Dashboard and rankings

- Status: Implemented
- Requirements: FR-4.1 – FR-4.6

## Problem / motivation

Admins need to see who is meeting attendance goals. Students compete only within their category (FRC vs FRC, FTC vs FTC), and mentors are ranked among themselves.

## User stories

- As an **admin**, I see three rankings with hours and % to date.
- As an **admin**, I see who is in the lab right now.
- As an **admin**, I drill into a member's history and export data.

## Acceptance criteria

- **004-AC1**: `/admin` shows three ranking tables (Alunos FRC, Alunos FTC, Mentores) for the current season. A member never appears in a table other than their track's.
- **004-AC2**: Columns: #, name, hours in the selected week, the week's goal, % of the week, season hours up to the end of that week, season % at that point. Members are ranked by the week's % (ties: week hours, then name; equal values share a position). *(Changed 2026-10-10: the dashboard is per week, like V1.)*
- **004-AC3**: % cells are colored ≥ green threshold (default 100), ≥ yellow (default 75), otherwise red. The thresholds come from `settings`.
- **004-AC4**: Filters: season (default current) and **week** (a list of the season's weeks up to today, default the current week), with previous/next week buttons. Changing them recomputes all values. *(Replaced the "as of" date and the full-season toggle, 2026-10-10.)*
- **004-AC5**: The "Agora no lab" panel lists open sessions with their elapsed time and refreshes at least every 30 s.
- **004-AC6**: Each track table shows a summary: number of active members, average % of the week, and how many met the week's goal (≥ the green threshold).
- **004-AC7**: `/admin/membros/[id]` shows a session list (editable per spec 006), a weekly hours bar chart, and a cumulative worked vs expected line chart.
- **004-AC8**: The "Exportar CSV" buttons download the rankings (per track) and the sessions (date range), in UTF-8 with a BOM so Excel opens them.
- **004-AC9**: Non-admins get a 404 or redirect for every `/admin` route, and the ranking RPC refuses non-admin callers.

## Edge cases

- Members with zero sessions still appear, at 0%.
- Inactive members are hidden.
- A track with no phases shows hours but "—" for %.

## Out of scope

- A public leaderboard on the kiosk (possible later).
