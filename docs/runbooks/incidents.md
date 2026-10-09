# Runbook — incidents

| Symptom | Likely cause | Fix |
|---|---|---|
| Kiosk shows "Sem conexão" for everyone | Supabase project paused (free tier) or outage | Supabase dashboard → Restore project. Check `keepalive.yml` runs. |
| Sessions from yesterday still open | Vercel Cron failed | Vercel → Cron Jobs → run `/api/cron/auto-close` manually. Check `CRON_SECRET`. |
| Kiosk says "Quiosque não autorizado" | Cookie cleared or `KIOSK_TOKEN` rotated | Re-run [kiosk-setup.md](kiosk-setup.md) step 2. |
| Deploy didn't happen after merge | `deploy.yml` migration failed | Check the Actions logs. Fix with a new migration PR; never edit applied migrations. |
| Bad deploy | Regression | Vercel → Deployments → Promote the previous one. |
| Invitee can't sign up with Google | Redirect URL missing | Supabase Auth → URL configuration → add the URL. |
