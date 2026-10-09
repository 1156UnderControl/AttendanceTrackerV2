# Auth and security

## Identities

| Identity | How it authenticates | What it can do |
|---|---|---|
| **Member** | Supabase Auth: Google OAuth or email + password | Read their own data, edit their own name and code, request corrections |
| **Admin** | Same as a member, plus a row in `admins` | Everything in `/admin` |
| **Kiosk device** | httpOnly cookie `kiosk_token`, set at `/kiosk/unlock` by an admin | Only `kiosk_toggle`, `kiosk_checkout`, `kiosk_present` |
| **Cron** | `Authorization: Bearer $CRON_SECRET` (sent by Vercel Cron) | Only `close_stale_sessions` |

## Invite flow

1. An admin creates an invite. The server generates 32 random bytes as a base64url token, stores `sha256(token)`, and shows the link `https://<host>/convite/<token>` **once**. The link can be copied again only by creating a new invite.
2. The invitee opens the link. `invite_preview(token)` returns `{valid, type, category}` and nothing else.
3. The invitee authenticates (Google or email + password). Email confirmation can stay **off**, because possessing the invite is the proof of legitimacy. This avoids needing SMTP.
4. `redeem_invite(token, name, category, code)` runs as the authenticated user. In one transaction it:
   - takes a `select … for update` lock on the invite, and checks it isn't revoked, isn't expired, and has `uses < max_uses`
   - checks the caller has no member row yet
   - checks the category: if the invite fixed one, it must match
   - checks the code: 6 digits and unique. If it's empty, it generates one.
   - inserts the member and increments `uses`
5. An authenticated user **without** a member row can only reach `/convite/*` and `/login`.

## Kiosk device token

- `KIOSK_TOKEN` is a long random secret stored in Vercel env vars.
- At `/kiosk/unlock`, a logged-in admin clicks "Ativar este computador como quiosque". The server sets the cookie `kiosk_token=<KIOSK_TOKEN>` (httpOnly, Secure, SameSite=Strict, 1 year). The admin also picks the kiosk's default language, which sets the `locale` cookie.
- Kiosk server actions compare the cookie to `KIOSK_TOKEN` in constant time, then call the kiosk RPCs with the service-role client.
- Rotating `KIOSK_TOKEN` revokes every kiosk; an admin then re-unlocks the lab PC.
- Rate limiting: kiosk actions are limited to about 30/minute per device. Codes are 6 digits, so brute force from the kiosk itself is not a realistic threat model.

## Authorization layers

1. **Proxy** (`src/proxy.ts`, Next 16's renamed middleware): an optimistic check that redirects unauthenticated users from `/admin` and `/minha-presenca` to `/login`.
2. **Server helpers**: `requireAdmin()` and `requireMember()` at the top of every server action and page.
3. **RLS**: the final guard. See the matrix in [data-model.md](data-model.md#rls-policy-matrix).

## Secrets

| Secret | Where | Used by |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Vercel (per env) | Browser and server |
| `SUPABASE_SECRET_KEY` (`sb_secret_…`, acts as the `service_role` Postgres role) | Vercel (server only) | Kiosk and cron RPCs only |
| `KIOSK_TOKEN` | Vercel | Kiosk cookie check |
| `CRON_SECRET` | Vercel | Cron route |
| `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD_*`, `SUPABASE_PROJECT_REF_*` | GitHub Actions | Migrations |
| `RESEND_API_KEY` (optional) | Supabase Auth SMTP settings | Password reset and invite emails |

Never prefix the secret key with `NEXT_PUBLIC_`. Never commit `.env*` files except `.env.example`.

## Threats considered

| Threat | Mitigation |
|---|---|
| Someone checks in for a friend at the kiosk | Accepted risk, same as V1. The audit trail shows the times and admins review anomalies. |
| A student registers as a mentor | The invite fixes the type. |
| A member reads others' data | RLS, plus aggregated-only RPC output for rankings. |
| A leaked invite link | Expiry, max uses, and revocation. Admins see who redeemed each invite. |
| A tampered kiosk clock | Timestamps come from `now()` in the DB. |
| A stolen service key | Server-only env var, never sent to the client. Rotate it in Supabase if leaked. |
