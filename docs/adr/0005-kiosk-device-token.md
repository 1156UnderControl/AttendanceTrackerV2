# 0005 — Kiosk authenticated as a device

- Status: Accepted
- Date: 2026-10-09

## Context
The lab computer is shared, and people check in with a 6-digit code, not a login. The kiosk endpoints must not be callable from anywhere on the internet.

## Decision
- An admin "unlocks" the lab browser once. That sets an httpOnly cookie holding `KIOSK_TOKEN`.
- Kiosk server actions validate the cookie and call narrow `security definer` SQL functions with the service-role client.
- The kiosk exposes only member names and check-in times.

## Consequences
- No login per person at the kiosk, the same user experience as V1.
- Rotating `KIOSK_TOKEN` revokes every kiosk.
- More kiosks (e.g. a second lab) only need another unlock.
