# Runbook — set up the lab kiosk

1. On the lab PC, open the prod URL and log in as an admin.
2. Go to `/kiosk/unlock` (Admin → Quiosque), choose the kiosk's default language, click "Ativar este computador como quiosque", then sign out. The kiosk keeps working after sign-out.
3. Open `/kiosk` in kiosk mode, e.g. Chrome: `chrome --kiosk https://<prod-url>/kiosk`. Add it to the OS startup.
4. Disable sleep and screen lock on the PC, and keep it on wired network if possible.
5. Test: check in with your code, then check out by tapping your name and confirming.

The PT/EN buttons in the kiosk header switch its language. Greetings always use each member's own language.

**Revoke a kiosk:** rotate `KIOSK_TOKEN` in Vercel, redeploy, and unlock the remaining kiosks again.
