-- Function privileges, as an explicit allowlist (008-AC2).
-- Postgres grants EXECUTE on new functions to PUBLIC by default, so revoke everything
-- and grant back only what each API role needs. supabase/tests/00_schema_test.sql fails
-- if a function outside these lists becomes executable by anon or authenticated.
--
-- Future migrations that add functions must revoke from public/anon/authenticated and
-- grant explicitly, then update the allowlist in 00_schema_test.sql.

revoke execute on all functions in schema public from public, anon, authenticated;

-- anon: only the invite page preview.
grant execute on function public.invite_preview(text) to anon, authenticated;

-- authenticated: helpers used by RLS policies and guard triggers, plus member/admin RPCs.
grant execute on function
  public.is_admin(),
  public.current_member_id(),
  public.app_timezone(),
  public.member_track(public.member_type, public.category),
  public.local_day_start(date),
  public.session_minutes(public.sessions, timestamptz, timestamptz, timestamptz),
  public.expected_minutes(uuid, public.track, timestamptz),
  public.expected_full_minutes(uuid, public.track),
  public.current_season_id(),
  public.ranking(uuid, public.track, timestamptz),
  public.my_stats(uuid, timestamptz),
  public.create_invite(public.member_type, public.category, text, integer, integer),
  public.redeem_invite(text, text, public.category, text, text),
  public.request_correction(uuid, timestamptz, text),
  public.review_correction(uuid, boolean),
  public.set_current_season(uuid)
  to authenticated;

-- service_role (kiosk and cron server code): everything, as Supabase grants by default.
grant execute on all functions in schema public to service_role;
