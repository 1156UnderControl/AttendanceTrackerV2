# 005 — Member self-service ("Minha presença")

- Status: In progress (AC3 chart pending, ships with spec 004's charts)
- Requirements: FR-5.1 – FR-5.2

## User stories

- As a **member**, I see my hours, my % and my position, so I know whether I'm meeting the goal.
- As a **member**, I see my session history and fix my profile.

## Acceptance criteria

- **005-AC1**: `/minha-presenca` shows hours this week, hours in the current phase, season hours, expected hours to date, % to date with its color band, and "Posição: N de M" in the member's track.
- **005-AC2**: It shows a list of the member's sessions (date, entrance, exit, duration), newest first, with pagination. Auto-closed sessions are marked "Saída não registrada". The "Pedir correção" button ships with spec 006.
- **005-AC3**: It shows a weekly hours chart compared with the expected weekly hours for each phase.
- **005-AC4**: A member can edit their name and entrance code (unique, 6 digits). Type and category are read-only and say "fale com um admin".
- **005-AC5**: A member can never read another member's sessions or individual stats. Verified by RLS tests: requesting another member's data returns empty or is denied.
- **005-AC6**: Members who are also admins see a link to `/admin`.
- **005-AC7**: A member can choose their language (Português / English) on their profile. It's saved in `members.locale`, applies to every page on any device, and is used by the kiosk greeting.

## Out of scope

- Seeing other members' names or hours in the ranking. Only the member's own position is shown.
