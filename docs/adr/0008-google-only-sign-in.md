# 0008 — Google is the only sign-in method

- Status: Accepted
- Date: 2026-10-10
- Amends: [0002](0002-invite-based-registration.md) (which allowed Google or email + password)

## Context

Members already have Google accounts (school or personal). Email + password adds password resets, which need an SMTP provider (Resend), plus password-strength rules and a larger attack surface, all for a tool used by about 50 people.

## Decision

- Staging and production allow **only Google** sign-in through Supabase Auth. The **Email provider is disabled** in both projects.
- The invite flow is unchanged (ADR 0002): an invite link fixes the member type, then Google sign-in, then the profile step.
- **Local development and CI** can't use real Google sign-in without credentials. They use a **dev login** against seeded accounts (`admin@local.test`, `ana@local.test`, password `devpassword`), shown only when `ENABLE_DEV_LOGIN=true`. That variable is written by `pnpm env:local`. The dev login is also **hard-disabled on any Vercel deployment** (`VERCEL_ENV` is set), and sign-in would fail anyway because the cloud projects have the email provider off. This defense in depth was added after the dev login form appeared on production right after launch (2026-10-10).
- Real Google sign-in can be tested locally by enabling `[auth.external.google]` in `supabase/config.toml` with your own OAuth client.

## Consequences

- No SMTP or email templates are needed. Resend is no longer part of the plan.
- A member without a Google account can't join. Accepted: everyone on the team has one.
- The Google OAuth consent screen must be published ("In production"). Otherwise only listed test users can sign in. Basic scopes (email, profile) don't need Google verification.

## Alternatives considered

- Email + password: password resets need SMTP, and more code.
- Magic links: still need SMTP, and are clumsy on a shared lab computer.
