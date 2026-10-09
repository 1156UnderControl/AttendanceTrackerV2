# Runbook — set up the lab kiosk

1. On the lab PC, open the prod URL and log in as an admin.
2. Go to `/kiosk/unlock` and click "Ativar este computador como quiosque", then log out.
3. Open `/kiosk` in kiosk mode, e.g. Chrome: `chrome --kiosk https://<prod-url>/kiosk`. Add it to the OS startup.
4. Disable sleep and screen lock on the PC, and keep it on wired network if possible.
5. Test: check in with a test code, check out by clicking the name.

**Revoke a kiosk:** rotate `KIOSK_TOKEN` in Vercel, redeploy, and unlock the remaining kiosks again.
