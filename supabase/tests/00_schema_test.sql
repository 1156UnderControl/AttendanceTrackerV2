-- Privileges and RLS coverage (008-AC2).
begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

select is(
  (select array_agg(tablename::text order by tablename) from pg_tables where schemaname = 'public' and not rowsecurity),
  null,
  '[008-AC2] every public table has RLS enabled'
);

select is(
  (select count(*)::integer from information_schema.role_table_grants where table_schema = 'public' and grantee = 'anon'),
  0,
  '[008-AC2] anon has no table privileges'
);

select ok(not has_function_privilege('authenticated', 'public.kiosk_toggle(text)', 'execute'), '[008-AC2] authenticated cannot call kiosk_toggle');
select ok(not has_function_privilege('anon', 'public.kiosk_toggle(text)', 'execute'), '[008-AC2] anon cannot call kiosk_toggle');
select ok(not has_function_privilege('authenticated', 'public.kiosk_checkout(uuid)', 'execute'), '[008-AC2] authenticated cannot call kiosk_checkout');
select ok(not has_function_privilege('authenticated', 'public.kiosk_present()', 'execute'), '[008-AC2] authenticated cannot call kiosk_present');
select ok(not has_function_privilege('authenticated', 'public.close_stale_sessions(timestamptz)', 'execute'), '[008-AC2] authenticated cannot call close_stale_sessions');
select ok(not has_function_privilege('authenticated', 'public.ranking_unchecked(uuid, public.track, timestamptz)', 'execute'), '[008-AC2] ranking_unchecked is not exposed');
select ok(has_function_privilege('service_role', 'public.kiosk_toggle(text)', 'execute'), 'service_role can call kiosk_toggle');
select ok(has_function_privilege('anon', 'public.invite_preview(text)', 'execute'), 'anon can preview invites');
select ok(not has_function_privilege('anon', 'public.redeem_invite(text, text, public.category, text, text)', 'execute'), 'anon cannot redeem invites');
select ok(not has_function_privilege('anon', 'public.my_stats(uuid, timestamptz)', 'execute'), 'anon cannot read stats');

-- Allowlists: adding a function to the API must be a deliberate change here.
select is(
  (select array_agg(p.oid::regprocedure::text order by p.oid::regprocedure::text)
   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute')),
  array['invite_preview(text)'],
  '[008-AC2] anon can execute only the allowlisted functions'
);

select is(
  (select array_agg(p.oid::regprocedure::text order by p.oid::regprocedure::text)
   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and has_function_privilege('authenticated', p.oid, 'execute')),
  array[
    'app_timezone()',
    'create_invite(member_type,category,text,integer,integer)',
    'current_member_id()',
    'current_season_id()',
    'expected_full_minutes(uuid,track)',
    'expected_minutes(uuid,track,timestamp with time zone)',
    'invite_preview(text)',
    'is_admin()',
    'local_day_start(date)',
    'member_track(member_type,category)',
    'my_stats(uuid,timestamp with time zone)',
    'ranking(uuid,track,timestamp with time zone)',
    'redeem_invite(text,text,category,text,text)',
    'request_correction(uuid,timestamp with time zone,text)',
    'review_correction(uuid,boolean)',
    'session_minutes(sessions,timestamp with time zone,timestamp with time zone,timestamp with time zone)',
    'set_current_season(uuid)'
  ],
  '[008-AC2] authenticated can execute only the allowlisted functions'
);

select * from finish();
rollback;
