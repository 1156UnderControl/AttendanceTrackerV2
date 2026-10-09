# Runbook — rotating secrets

Set a yearly reminder for **September**. The off-season is the safe time, before the Vercel token created in October expires. Rotate immediately if a value may have leaked.

| Secret | Where to create the new value | Where to update it | Then |
|---|---|---|---|
| `VERCEL_TOKEN` | Vercel → Account → Tokens (Under Control team, 1 year) | `gh secret set VERCEL_TOKEN` | Re-run the last **Deploy** run, then delete the old token |
| DB password (staging/prod) | Supabase → Project Settings → Database → Reset database password | `gh secret set SUPABASE_DB_PASSWORD_STAGING` / `_PROD` | Run **Keep-alive** manually |
| `SUPABASE_SECRET_KEY` | Supabase → Project Settings → API Keys → create a new secret key | Vercel env var (Production or Preview) | Redeploy, then delete the old key in Supabase |
| `KIOSK_TOKEN` | `openssl rand -base64 48` | Vercel env var | Redeploy, then unlock the lab kiosk again ([kiosk-setup](kiosk-setup.md)) |
| `CRON_SECRET` | `openssl rand -base64 48` | Vercel env var | Redeploy. Vercel Cron sends the new value automatically. |

Store every new value in the team password manager, and delete the old entry.

**Symptoms of an expired token:**

- **Deploy** fails at "Apply migrations" with *Database connection failed*: the DB password changed, or the project is paused.
- **Deploy** fails at "Pull Vercel production settings" with *401/403*: the Vercel token expired.
