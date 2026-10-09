# 0003 — Auto-close forgotten sessions with 0 h credit

- Status: Accepted
- Date: 2026-10-09

## Context
People forget to check out. V1 deleted open sessions nightly, which lost the record entirely.

## Decision
- Every day at the cutoff (default **04:00** local, because students sometimes stay past midnight), `close_stale_sessions()` closes every session still open: `check_out` = the cutoff instant, `auto_closed = true`, `credited_minutes = 0`.
- The member can request a correction with their real exit time, and an admin approves or rejects it. Admins can also edit or discard any session directly.
- All changes are audited.

## Consequences
- Forgetting costs hours until corrected, which encourages checking out properly without losing data.
- Adds a correction workflow (spec 006).
- If the cron fails, sessions stay open and count live hours. Runbook: [incidents](../runbooks/incidents.md).
