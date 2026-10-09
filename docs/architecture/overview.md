# Architecture overview

## System context (C4 level 1)

```mermaid
flowchart LR
  member([Member<br/>student / mentor])
  admin([Admin])
  kioskUser([Person at the lab])
  subgraph sys[AttendanceTrackerV2]
    app[Next.js app on Vercel]
  end
  supa[(Supabase<br/>Postgres + Auth)]
  google[Google OAuth]
  resend[Resend SMTP<br/>optional]
  gha[GitHub Actions]

  kioskUser -->|types code / clicks name| app
  member -->|views own attendance| app
  admin -->|manages, views dashboards| app
  app --> supa
  supa --> google
  supa --> resend
  gha -->|CI, migrations, keep-alive| supa
  gha -->|gates deploy| app
```

## Containers (C4 level 2)

```mermaid
flowchart TB
  subgraph vercel[Vercel Hobby]
    direction TB
    kiosk["/kiosk<br/>full-screen check-in UI"]
    memberUI["/minha-presenca<br/>member area"]
    adminUI["/admin/*<br/>dashboard, members, invites, seasons, sessions"]
    invite["/convite/[token]<br/>signup via invite"]
    api["Server actions + route handlers"]
    cron["/api/cron/auto-close<br/>(Vercel Cron, daily)"]
  end
  subgraph supabase[Supabase Free]
    auth[Supabase Auth]
    db[(Postgres<br/>tables + RLS + SQL functions)]
  end

  kiosk --> api
  memberUI --> api
  adminUI --> api
  invite --> api
  cron --> api
  api -->|user session JWT, RLS applies| db
  api -->|service role, kiosk & cron only, via SQL functions| db
  api --> auth
```

## Route map

| Route | Who | Notes |
|---|---|---|
| `/kiosk` | Kiosk device (cookie `kiosk_token`) | Code entry and the present-members grid. |
| `/kiosk/unlock` | Admin | Sets the kiosk cookie on the current device. |
| `/login` | Anyone | Google or email + password. |
| `/convite/[token]` | Invitee | Signup and profile (name, category, code). |
| `/minha-presenca` | Member | Own stats and sessions, correction requests. |
| `/admin` | Admin | Dashboard: 3 rankings, "Agora no lab". |
| `/admin/membros`, `/admin/membros/[id]` | Admin | Member management and detail. |
| `/admin/convites` | Admin | Create, copy and revoke invites. |
| `/admin/temporadas` | Admin | Seasons and phases per track. |
| `/admin/sessoes` | Admin | Pending, auto-closed and correction requests; edit sessions. |
| `/api/cron/auto-close` | Vercel Cron (`CRON_SECRET`) | Calls `close_stale_sessions()`. |
| `/api/health` | GitHub Actions | Keep-alive: runs a trivial DB query. |

## Code layout (planned)

```
src/
  app/                 # routes above (App Router)
  components/          # shared UI (shadcn/ui based)
  lib/
    supabase/          # server/browser/service clients (@supabase/ssr)
    attendance/        # pure TS math (expected hours, %, week ranges), unit-tested
    auth/              # requireAdmin(), requireMember(), kiosk token check
    validation/        # Zod schemas
  i18n/
    config.ts          # locales ['pt-BR','en'], default 'pt-BR'
    request.ts         # next-intl getRequestConfig: resolves the locale (member → cookie → Accept-Language → default)
messages/
  pt-BR.json           # source of truth for keys
  en.json
    database.types.ts  # generated
supabase/
  migrations/          # SQL migrations (the only way to change the schema)
  seed.sql             # local/staging demo data
  tests/               # pgTAP tests (RLS, RPCs)
tests/e2e/             # Playwright
```

## Internationalization

The UI uses next-intl with **no locale in the URL** ([ADR 0006](../adr/0006-i18n-next-intl.md)). The locale is resolved per request: `members.locale` → `locale` cookie → `Accept-Language` → `pt-BR`. A language switcher in the header updates the cookie, and the member's profile too when they're logged in. Server actions and SQL functions return error **codes** (e.g. `CODE_IN_USE`), which the UI translates.

## Key flows

### Kiosk check-in/out

```mermaid
sequenceDiagram
  participant K as Kiosk UI
  participant S as Server action
  participant DB as Postgres
  K->>S: submit code
  S->>S: verify kiosk_token cookie
  S->>DB: rpc kiosk_toggle(code) (service role)
  DB->>DB: find active member by code
  alt no open session
    DB->>DB: insert session(check_in=now())
    DB-->>S: {action:"in", name}
  else open session
    DB->>DB: update check_out=now()
    DB-->>S: {action:"out", name, minutes}
  end
  S-->>K: feedback + refreshed present list
```

### Invite redemption

```mermaid
sequenceDiagram
  participant U as Invitee
  participant A as App
  participant Auth as Supabase Auth
  participant DB as Postgres
  U->>A: open /convite/<token>
  A->>DB: rpc invite_preview(token) (validity, type, fixed category)
  U->>Auth: sign up (Google or email+password)
  U->>A: submit name, category, code
  A->>DB: rpc redeem_invite(token, name, category, code) as the user
  DB->>DB: lock invite, check expiry/uses, insert member, uses+1
  DB-->>A: member
  A-->>U: redirect /minha-presenca
```

More detail: [data-model.md](data-model.md), [auth-and-security.md](auth-and-security.md), [attendance-math.md](attendance-math.md), [ci-cd.md](ci-cd.md).
