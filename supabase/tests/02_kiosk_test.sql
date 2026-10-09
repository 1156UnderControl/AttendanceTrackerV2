-- Kiosk check-in/out (spec 001).
begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

insert into public.members (id, name, code, type, category, active) values
  ('20000000-0000-0000-0000-0000000000a1', 'Kiosk Student', '910001', 'student', 'FRC', true),
  ('20000000-0000-0000-0000-0000000000a2', 'Inactive Student', '910002', 'student', 'FRC', false),
  ('20000000-0000-0000-0000-0000000000a3', 'Kiosk Mentor', '910003', 'mentor', 'FTC', true);

select is(public.kiosk_toggle('999999') ->> 'error', 'CODE_NOT_FOUND', '[001-AC4] unknown code is rejected');
select is(public.kiosk_toggle('910002') ->> 'error', 'CODE_NOT_FOUND', '[001-AC4] inactive member is rejected');
select is((select count(*)::integer from public.sessions where member_id in
  ('20000000-0000-0000-0000-0000000000a1', '20000000-0000-0000-0000-0000000000a2')), 0,
  '[001-AC4] rejected codes write nothing');

select is(public.kiosk_toggle('910001') ->> 'action', 'in', '[001-AC1] first code entry checks in');
select is((select check_in from public.sessions where member_id = '20000000-0000-0000-0000-0000000000a1'), now(),
  '[001-AC1] check-in time comes from the database clock');
select is(public.kiosk_toggle('910001') ->> 'action', 'noop', '[001-AC1] a repeat within 5 s is ignored');

update public.sessions set check_in = now() - interval '2 hours'
where member_id = '20000000-0000-0000-0000-0000000000a1';

select is(public.kiosk_toggle('910001') - 'member_id',
  '{"ok": true, "action": "out", "name": "Kiosk Student", "locale": "pt-BR", "minutes": 120}'::jsonb,
  '[001-AC2] code entry with an open session checks out and reports the duration');
select is(public.kiosk_toggle('910001') ->> 'action', 'noop', '[001-AC2] a repeat right after check-out is ignored');

-- Present list and checkout from the grid.
insert into public.sessions (member_id, check_in) values
  ('20000000-0000-0000-0000-0000000000a3', now() - interval '30 minutes');

select is((select array_agg(name) from public.kiosk_present()), array['Kiosk Mentor'],
  '[001-AC3] the present list shows open sessions only');
select is(public.kiosk_checkout('20000000-0000-0000-0000-0000000000a3') ->> 'minutes', '30',
  '[001-AC3] checkout from the grid closes the session');
select is(public.kiosk_checkout('20000000-0000-0000-0000-0000000000a3') ->> 'error', 'NO_OPEN_SESSION',
  '[001-AC3] checkout without an open session is rejected');

-- One open session per member, even with direct inserts.
insert into public.sessions (member_id, check_in) values ('20000000-0000-0000-0000-0000000000a1', now());
-- discarded = true skips the overlap constraint, so this exercises the unique index alone.
select throws_ok(
  $$insert into public.sessions (member_id, check_in, discarded) values ('20000000-0000-0000-0000-0000000000a1', now(), true)$$,
  '23505', null, '[001-AC5] a second open session is impossible');

select throws_ok(
  $$insert into public.sessions (member_id, check_in, check_out)
    values ('20000000-0000-0000-0000-0000000000a1', now() - interval '3 hours', now() - interval '1 hour 30 minutes')$$,
  '23P01', null, '[006-AC5] overlapping sessions for one member are impossible');

select * from finish();
rollback;
