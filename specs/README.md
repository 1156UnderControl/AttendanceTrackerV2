# Specs (Spec-Driven Development)

Each feature lives in `specs/NNN-short-name/` with three files:

| File | Answers | Written when |
|---|---|---|
| `spec.md` | **What and why**: user stories, acceptance criteria, edge cases, out of scope | Before any design. Reviewed by a mentor or lead. |
| `plan.md` | **How**: routes, components, migrations, RPCs, risks | When the feature is picked up |
| `tasks.md` | **Steps**: ordered checklist, each item small and testable | After the plan |

Status lifecycle: `Draft → Approved → In progress → Implemented` (or `Superseded`).

Acceptance criteria use IDs `NNN-ACx`. Every one must have at least one test whose name contains its ID.

| # | Spec | Status |
|---|---|---|
| 001 | [Kiosk check-in/out](001-kiosk-check-in-out/spec.md) | Approved |
| 002 | [Invites and registration](002-invites-and-registration/spec.md) | Implemented |
| 003 | [Seasons and phases](003-seasons-and-phases/spec.md) | Approved |
| 004 | [Dashboard and rankings](004-dashboard-rankings/spec.md) | Approved |
| 005 | [Member self-service](005-member-self-service/spec.md) | In progress |
| 006 | [Auto-close and corrections](006-auto-close-and-corrections/spec.md) | Approved |
| 007 | [CI/CD pipeline](007-ci-cd-pipeline/spec.md) | In progress |
| 008 | [Database foundation](008-database-foundation/spec.md) | In progress |

Templates: [000-template](000-template/).
