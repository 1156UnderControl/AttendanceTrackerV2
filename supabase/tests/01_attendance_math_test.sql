-- Worked examples from docs/architecture/attendance-math.md (003-AC6, 008-AC3).
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

insert into public.seasons (id, name, starts_on, ends_on) values
  ('10000000-0000-0000-0000-000000000001', 'Math test', '2026-10-01', '2027-04-30');
insert into public.season_phases (season_id, track, name, starts_on, ends_on, weekly_hours) values
  ('10000000-0000-0000-0000-000000000001', 'FRC_STUDENTS', 'Pre-season', '2026-10-01', '2027-01-08', 8),
  ('10000000-0000-0000-0000-000000000001', 'FRC_STUDENTS', 'Build', '2027-01-09', '2027-02-28', 60),
  ('10000000-0000-0000-0000-000000000001', 'FRC_STUDENTS', 'Competition', '2027-03-01', '2027-04-30', 42);

select is(public.local_day_start('2026-10-01'), '2026-10-01 03:00:00+00'::timestamptz,
  'local midnight is in America/Sao_Paulo (UTC-3)');

select is(public.expected_minutes('10000000-0000-0000-0000-000000000001', 'FRC_STUDENTS', '2026-10-07 12:00-03'),
  480::numeric, '[003-AC6] example 1: 7 days into pre-season = 8 h');

select is(round(public.expected_minutes('10000000-0000-0000-0000-000000000001', 'FRC_STUDENTS', '2027-01-15 12:00-03') / 60, 2),
  174.29, '[003-AC6] example 2: all of pre-season + 7 days of build = 174.29 h');

select is(public.expected_minutes('10000000-0000-0000-0000-000000000001', 'FRC_STUDENTS', '2026-09-20 12:00-03'),
  0::numeric, '[003-AC6] example 3: before any phase = 0');

select is(round(public.expected_full_minutes('10000000-0000-0000-0000-000000000001', 'FRC_STUDENTS') / 60, 2),
  917.43, '[003-AC6] example 6: full FRC season = 917.43 h');

insert into public.members (id, name, code, type, category) values
  ('10000000-0000-0000-0000-0000000000a1', 'Math Student', '900001', 'student', 'FRC');

-- Example 4: a session across midnight Sunday is split between weeks.
insert into public.sessions (id, member_id, check_in, check_out) values
  ('10000000-0000-0000-0000-0000000000b1', '10000000-0000-0000-0000-0000000000a1', '2026-10-11 22:00-03', '2026-10-12 01:00-03');

select is(
  public.session_minutes(s, public.local_day_start('2026-10-05'), public.local_day_start('2026-10-12'), now()),
  120::numeric, '[003-AC6] example 4: 120 min in the week of Oct 5')
from public.sessions s where s.id = '10000000-0000-0000-0000-0000000000b1';

select is(
  public.session_minutes(s, public.local_day_start('2026-10-12'), public.local_day_start('2026-10-19'), now()),
  60::numeric, '[003-AC6] example 4: 60 min in the week of Oct 12')
from public.sessions s where s.id = '10000000-0000-0000-0000-0000000000b1';

-- Example 5: auto-closed sessions count 0 until corrected.
update public.sessions
set check_in = '2026-10-02 18:00-03', check_out = '2026-10-03 04:00-03', auto_closed = true, credited_minutes = 0
where id = '10000000-0000-0000-0000-0000000000b1';

select is(public.member_worked_minutes('10000000-0000-0000-0000-0000000000a1', public.local_day_start('2026-10-01'), public.local_day_start('2026-10-08'), now()),
  0::numeric, '[003-AC6] example 5: auto-closed session counts 0');

update public.sessions set check_out = '2026-10-02 21:00-03', credited_minutes = null
where id = '10000000-0000-0000-0000-0000000000b1';

select is(public.member_worked_minutes('10000000-0000-0000-0000-0000000000a1', public.local_day_start('2026-10-01'), public.local_day_start('2026-10-08'), now()),
  180::numeric, '[003-AC6] example 5: after correction to 21:00 it counts 180 min');

-- Example 1 (%): 6 h worked against 8 h expected = 75%.
update public.sessions set check_in = '2026-10-03 09:00-03', check_out = '2026-10-03 15:00-03'
where id = '10000000-0000-0000-0000-0000000000b1';

select is(
  (select pct_to_date from public.ranking_unchecked('10000000-0000-0000-0000-000000000001', 'FRC_STUDENTS', '2026-10-07 12:00-03')
   where member_id = '10000000-0000-0000-0000-0000000000a1'),
  75.0, '[003-AC6] example 1: 6 h of 8 h expected = 75%');

select * from finish();
rollback;
