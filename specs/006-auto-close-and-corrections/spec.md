# 006 — Auto-close and corrections

- Status: Approved
- Requirements: FR-6.1 – FR-6.4
- Related ADRs: [0003](../../docs/adr/0003-auto-close-forgotten-sessions.md)

## Acceptance criteria

- **006-AC1**: Given open sessions, when `/api/cron/auto-close` is called with a valid `CRON_SECRET`, then every session still open **that started before today's cutoff instant** (default 04:00 local, from `settings.auto_close_time`) gets `check_out` = that cutoff instant, never the job's run time, `auto_closed = true` and `credited_minutes = 0`. The response reports how many it closed.
- **006-AC2**: Calls without a valid secret get 401 and change nothing. The job is idempotent: running it twice closes nothing new.
- **006-AC3**: A member can request a correction for their own auto-closed session, with a check-out time after the check-in and no later than the auto-close instant (so exits after midnight are allowed), plus an optional note. Only one pending request per session.
- **006-AC4**: `/admin/sessoes` lists pending corrections and auto-closed sessions without a request. Approving sets `check_out` to the requested time, sets `credited_minutes = null` and `auto_closed` stays true for history. Rejecting keeps 0 h.
- **006-AC5**: Admins can create a manual session, edit its check-in and check-out, or discard (soft delete) any session. Validation: check-out after check-in, and no overlap with the member's other sessions.
- **006-AC6**: Every admin change to sessions, members, invites, phases and settings writes an `audit_log` row with the actor, the action, and the before/after values. Admins can view the log at `/admin/auditoria`.
- **006-AC7**: The member sees the request status (pendente / aprovado / rejeitado) on "Minha presença".

## Edge cases

- Someone who checks in shortly before 04:00 (e.g. 03:50) is also auto-closed and must request a correction. This is acceptable because it is rare.
- Vercel Hobby cron may fire any time within the scheduled hour (04:00–04:59 BRT). Sessions that start after 04:00 but before the job runs are left open.
- Brazil has no daylight saving time. The cutoff still uses TZ-aware conversion in case that changes.
