# 0009 — Keep the V1 visual identity, light only

- Status: Accepted
- Date: 2026-10-10

## Context

The team is used to the V1 tracker's look: League Spartan, navy header with the TEAM 1156 logo, team yellow, thick black borders and hard shadows, and the playful kiosk with the tilted code box and floating name bubbles. The first V2 screens used a generic neutral style that followed the system dark mode instead.

## Decision

- V2 adopts the V1 identity, documented as tokens and components in [design-system.md](../architecture/design-system.md).
- **Light only.** The neo-brutalist borders and shadows don't translate well to dark backgrounds, and V1 was light only.
- One deliberate change: **black text on yellow** instead of V1's white, for WCAG contrast.

## Consequences

- Familiar for members and mentors; the kiosk keeps its character.
- All styling goes through `src/components/ui.tsx` and the theme tokens, so future screens stay consistent.
- No dark mode. That can be revisited with a dedicated dark palette if ever needed.
