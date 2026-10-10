# Runbook — set up from zero

How the infrastructure was created in October 2026, and how to recreate it. Never paste secret values into chats, issues or commits. Keep them in the team password manager.

## 1. Supabase (two projects)

1. Go to <https://supabase.com/dashboard>, create an organization on the **Free** plan (it allows only 2 active projects), and create these projects:

   | Project | Region | Ref |
   |---|---|---|
   | `uc-attendance-staging` | South America (São Paulo) | `tgpsavnhvhovlhdznasu` |
   | `uc-attendance-prod` | South America (São Paulo) | `xnhrsudlvgeglesmhezc` |

   - Database password: generate one and store it in the password manager.
   - Security options: **Enable Data API** on; **Automatically expose new tables** **off**; **Enable automatic RLS** on. See [data-model.md](../architecture/data-model.md#exposure-and-rls-defaults).
2. Authentication → Sign In / Providers: **Email off** and **Google on** (ADR 0008), with the client ID and secret from [section 1b](#1b-google-oauth-client).
3. Authentication → URL Configuration:
   - prod: Site URL `https://attendance-tracker-v2-ten.vercel.app`, plus the redirect URL `https://attendance-tracker-v2-ten.vercel.app/**`
   - staging: the Vercel preview URL wildcard
4. Note the **Session pooler host** (project → Connect → Direct → Session pooler): `aws-1-sa-east-1.pooler.supabase.com`. CI doesn't need a Supabase access token (see [ci-cd.md](../architecture/ci-cd.md#secrets-and-variables)).

## 1b. Google OAuth client

One OAuth client serves both Supabase projects.

1. <https://console.cloud.google.com> → create a project named `UC Attendance`.
2. **Google Auth Platform → Branding** (the OAuth consent screen): set the app name to "Presença Under Control", add a support email, and choose audience **External**.
3. **Audience → Publish app** ("In production"). In "Testing" mode only listed test users can sign in, and their sessions expire after 7 days. The basic scopes (`openid`, `email`, `profile`) need no Google verification.
4. **Clients → Create client → Web application**, named `Supabase`:
   - **Authorized JavaScript origins:** `https://attendance-tracker-v2-ten.vercel.app`
   - **Authorized redirect URIs:**
     - `https://xnhrsudlvgeglesmhezc.supabase.co/auth/v1/callback` (prod)
     - `https://tgpsavnhvhovlhdznasu.supabase.co/auth/v1/callback` (staging)
     - optional, for local testing: `http://127.0.0.1:54321/auth/v1/callback`
5. Copy the **Client ID** and **Client secret** into Supabase → Authentication → Sign In / Providers → Google, in **both** projects. Store the secret in the password manager.

## 2. Vercel

1. Sign up on **Hobby** with GitHub, and install the Vercel GitHub App on the `1156UnderControl` org (an org owner must approve).
2. Import `1156UnderControl/AttendanceTrackerV2` into the **Under Control** team, with the project name `attendance-tracker-v2`, the Next.js preset, and no build overrides.
3. Settings → Environment Variables: add each variable twice, once for Production (prod values) and once for Preview (staging values). Names, types and notes are listed in [ci-cd.md](../architecture/ci-cd.md#secrets-and-variables).
4. Account → Tokens: create a token scoped to the **Under Control** team, with a 1-year expiry.

## 3. GitHub

Run each command; it prompts for the value without echoing it:

```bash
gh secret set SUPABASE_DB_PASSWORD_STAGING
```

The other secrets work the same way: `SUPABASE_DB_PASSWORD_PROD`, `SUPABASE_PROJECT_REF_STAGING`, `SUPABASE_PROJECT_REF_PROD`, `VERCEL_TOKEN`, `VERCEL_ORG_ID` (the **Team ID**), `VERCEL_PROJECT_ID`.

The repository variable, the `production` environment and branch protection were set with `gh` (see [ci-cd.md](../architecture/ci-cd.md#branching-and-protection)):

```bash
gh variable set PRODUCTION_URL --body https://attendance-tracker-v2-ten.vercel.app
```

```bash
gh variable set SUPABASE_POOLER_HOST --body aws-1-sa-east-1.pooler.supabase.com
```

## 4. Verify

1. Run the **Keep-alive** workflow manually (Actions → Keep-alive → Run workflow). Both DB pings and the health check should pass.
2. Merge a PR to `main` and check that **Deploy** migrates staging, then prod, then deploys and passes the smoke test.

## 5. First admin

This comes after milestone 5. Sign up on prod, then in the Supabase SQL editor run `insert into admins(user_id) select id from auth.users where email = '<email>';`. Then continue with [new-season.md](new-season.md) and [kiosk-setup.md](kiosk-setup.md).
