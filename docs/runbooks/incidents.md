# Runbook — incidents

| Symptom | Likely cause | Fix |
|---|---|---|
| Kiosk shows "Sem conexão" for everyone | Supabase project paused (free tier) or outage | Supabase dashboard → Restore project. Check `keepalive.yml` runs. |
| Sessions from yesterday still open | Vercel Cron failed | Vercel → Settings → Cron Jobs → **Run** on `/api/cron/auto-close`, or `curl -H "Authorization: Bearer $CRON_SECRET" https://<prod>/api/cron/auto-close`. A 401 means `CRON_SECRET` differs between the cron and the env var. |
| A member says their hours are missing | Their session was auto-closed (0 h) | They use "Pedir correção" on Minha presença; an admin approves it in Admin → Sessões, or fixes the times on the member page. |
| Kiosk says "Quiosque não autorizado" | Cookie cleared or `KIOSK_TOKEN` rotated | Re-run [kiosk-setup.md](kiosk-setup.md) step 2. |
| Deploy didn't happen after merge | CI failed on `main`, or a `deploy.yml` step failed | Check Actions → Deploy. *Database connection failed* means the DB password or pooler host is wrong; a Vercel 401 means the token expired: see [rotating-secrets.md](rotating-secrets.md). A migration error needs a new migration PR; never edit applied migrations. |
| Keep-alive workflow failing | A project is paused, or the DB password changed | Restore the project in the Supabase dashboard, or update `SUPABASE_DB_PASSWORD_*`. |
| Bad deploy | Regression | Vercel → Deployments → Promote the previous one. |
| Invitee can't sign up with Google | Redirect URL missing | Supabase Auth → URL configuration → add the URL. |
