-- Auto-close and corrections (spec 006, ADR 0003).
begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

create function pg_temp.login(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end;
$$;
create function pg_temp.logout() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '', true);
  execute 'reset role';
end;
$$;

insert into auth.users (id, email) values
  ('50000000-0000-0000-0000-0000000000ad', 'admin@test.local'),
  ('50000000-0000-0000-0000-0000000000a1', 'a@test.local'),
  ('50000000-0000-0000-0000-0000000000b1', 'b@test.local');
insert into public.admins (user_id) values ('50000000-0000-0000-0000-0000000000ad');
insert into public.members (id, user_id, name, code, type, category) values
  ('50000000-0000-0000-0000-00000000000a', '50000000-0000-0000-0000-0000000000a1', 'Late Leaver', '950001', 'student', 'FRC'),
  ('50000000-0000-0000-0000-00000000000b', '50000000-0000-0000-0000-0000000000b1', 'Early Bird', '950002', 'student', 'FRC');
insert into public.sessions (id, member_id, check_in) values
  ('50000000-0000-0000-0000-0000000000e1', '50000000-0000-0000-0000-00000000000a', '2026-10-09 18:00-03'),
  ('50000000-0000-0000-0000-0000000000e2', '50000000-0000-0000-0000-00000000000b', '2026-10-10 04:10-03');

select is(public.close_stale_sessions('2026-10-10 04:35-03'), 1,
  '[006-AC1] the job closes sessions that started before the cutoff');
select is(
  (select row(check_out, auto_closed, credited_minutes)::text from public.sessions where id = '50000000-0000-0000-0000-0000000000e1'),
  row('2026-10-10 04:00-03'::timestamptz, true, 0)::text,
  '[006-AC1] check-out is the fixed 04:00 cutoff, flagged and credited 0');
select is((select check_out from public.sessions where id = '50000000-0000-0000-0000-0000000000e2'), null,
  '[006-AC1] a session that started after the cutoff stays open (Hobby cron timing)');
select is(public.close_stale_sessions('2026-10-10 04:50-03'), 0, '[006-AC2] running the job twice closes nothing new');
select is(public.close_stale_sessions('2026-10-11 02:00-03'), 0,
  '[006-AC2] before 04:00 the previous day''s cutoff applies');

-- Corrections
select pg_temp.login('50000000-0000-0000-0000-0000000000b1');
select throws_ok($$select public.request_correction('50000000-0000-0000-0000-0000000000e1', '2026-10-09 21:00-03')$$,
  'P0001', 'SESSION_NOT_FOUND', '[006-AC3] members cannot correct someone else''s session');
select pg_temp.logout();

select pg_temp.login('50000000-0000-0000-0000-0000000000a1');
select throws_ok($$select public.request_correction('50000000-0000-0000-0000-0000000000e1', '2026-10-10 05:00-03')$$,
  'P0001', 'INVALID_TIME', '[006-AC3] the corrected exit cannot be after the auto-close');
select is((select status::text from public.request_correction('50000000-0000-0000-0000-0000000000e1', '2026-10-10 01:30-03', 'Saí depois da meia-noite')),
  'pending', '[006-AC3] a member can request a correction, including after midnight');
select throws_ok($$select public.request_correction('50000000-0000-0000-0000-0000000000e1', '2026-10-09 21:00-03')$$,
  'P0001', 'ALREADY_PENDING', '[006-AC3] only one pending request per session');
select throws_ok($$select public.review_correction((select id from public.correction_requests limit 1), true)$$,
  '42501', 'FORBIDDEN', 'members cannot approve corrections');
select pg_temp.logout();

select pg_temp.login('50000000-0000-0000-0000-0000000000ad');
select is((select status::text from public.review_correction(
  (select id from public.correction_requests where session_id = '50000000-0000-0000-0000-0000000000e1'), true)),
  'approved', '[006-AC4] an admin approves the correction');
select pg_temp.logout();

select is(
  (select row(check_out, auto_closed, credited_minutes)::text from public.sessions where id = '50000000-0000-0000-0000-0000000000e1'),
  row('2026-10-10 01:30-03'::timestamptz, true, null::integer)::text,
  '[006-AC4] approval sets the real exit and restores credit; the auto-close flag stays for history');
select is(public.member_worked_minutes('50000000-0000-0000-0000-00000000000a', '2026-10-09 00:00-03', '2026-10-11 00:00-03', now()),
  450::numeric, '[006-AC4] the corrected session now counts 7.5 h');

select * from finish();
rollback;
