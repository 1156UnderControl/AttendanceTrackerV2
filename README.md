# AttendanceTrackerV2 — Team 1156 Under Control

Attendance tracker for the **1156 Under Control** robotics team (FRC and FTC).

- A **kiosk** computer in the lab: members type their entrance code to check in and click their name to check out.
- **Members** (students and mentors) join by invitation and can see their own attendance.
- **Admins** see rankings and attendance percentages per track (FRC students, FTC students, Mentors) against configurable season goals.

> Status: **milestone 5 (auth and invites).** Database, CI/CD, Google sign-in, invitations, member area and member management are in place. The kiosk and dashboards follow the [specs](specs/).

## Quick start

Requirements: Node 22 (`.nvmrc`), and Docker Desktop for the local database.

```bash
corepack enable
```

```bash
pnpm install
```

```bash
pnpm db:start
```

```bash
pnpm env:local
```

```bash
pnpm dev
```

Open <http://localhost:3000> and sign in with the **dev login** (`admin@local.test` is an admin; `ana@local.test` is an FRC student). Kiosk codes for the demo members are in `supabase/seed.sql`. All commands are listed in [AGENTS.md](AGENTS.md#commands).

## Documentation map

| Document | Purpose |
|---|---|
| [docs/sdd.md](docs/sdd.md) | Software Design Document: goals, requirements, scope |
| [docs/architecture/overview.md](docs/architecture/overview.md) | System context and containers (C4) |
| [docs/architecture/data-model.md](docs/architecture/data-model.md) | Tables, constraints, RLS matrix |
| [docs/architecture/auth-and-security.md](docs/architecture/auth-and-security.md) | Roles, invites, kiosk token, secrets |
| [docs/architecture/attendance-math.md](docs/architecture/attendance-math.md) | How hours, expected hours and % are computed |
| [docs/architecture/design-system.md](docs/architecture/design-system.md) | Visual identity: colors, font, components (V1 look) |
| [docs/architecture/ci-cd.md](docs/architecture/ci-cd.md) | Environments, pipelines, release and rollback |
| [docs/adr/](docs/adr/) | Architecture Decision Records |
| [docs/runbooks/](docs/runbooks/) | Operational how-tos |
| [docs/glossary.md](docs/glossary.md) | PT/EN domain terms |
| [specs/](specs/) | Feature specs (Spec-Driven Development) |
| [AGENTS.md](AGENTS.md) | Rules for AI coding agents and contributors |

## Stack

Next.js 16 (App Router) + TypeScript + Tailwind + next-intl (pt-BR / en) on **Vercel Hobby**, **Supabase Free** (Postgres + Auth), GitHub Actions for CI/CD. Everything runs on free tiers.

## How we work

Spec-Driven Development: **spec → plan → tasks → code → tests**. See [AGENTS.md](AGENTS.md) and [specs/README.md](specs/README.md).
