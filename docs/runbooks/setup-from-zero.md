# Runbook — set up from zero

1. **GitHub:** create the repo `AttendanceTrackerV2`, push `main`, and enable branch protection (see [ci-cd.md](../architecture/ci-cd.md#branching-and-protection)).
2. **Supabase:** create the projects `uc-attendance-staging` and `uc-attendance-prod` (region `sa-east-1`, São Paulo). Save the project refs and DB passwords.
   - Auth → Providers: enable Email (turn off "Confirm email") and Google (create an OAuth client in Google Cloud Console; add the Supabase callback URL).
   - Auth → URL configuration: the site URL is the Vercel prod URL. Add the preview URL pattern to the redirect allow-list.
   - Optional: Auth → SMTP → Resend (`smtp.resend.com`, port 465, user `resend`, password = API key).
3. **Vercel:** import the repo (framework Next.js). Set the env vars for Preview (staging values) and Production (prod values): see [ci-cd.md](../architecture/ci-cd.md#secrets-and-variables). Generate `KIOSK_TOKEN` and `CRON_SECRET` with `openssl rand -base64 48`.
4. **GitHub secrets:** add everything in the GitHub rows of that table. Create a GitHub Environment `production` (optionally with required reviewers).
5. **First deploy:** merge to `main`, then confirm `deploy.yml` migrates both DBs and deploys.
6. **First admin:** sign up on prod. In the Supabase SQL editor, run `insert into admins(user_id) select id from auth.users where email = '<email>';`. The first admin can create their own member profile through an invite they generate.
7. Continue with [new-season.md](new-season.md) and [kiosk-setup.md](kiosk-setup.md).
