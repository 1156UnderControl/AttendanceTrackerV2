-- Rankings per track and phase constraints (004-AC1, 004-AC2, 003-AC3, 003-AC1).
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

insert into public.seasons (id, name, starts_on, ends_on) values
  ('60000000-0000-0000-0000-000000000001', 'Ranking test', '2026-10-01', '2027-04-30');
insert into public.season_phases (season_id, track, name, starts_on, ends_on, weekly_hours) values
  ('60000000-0000-0000-0000-000000000001', 'FRC_STUDENTS', 'Pre', '2026-10-01', '2027-01-08', 8),
  ('60000000-0000-0000-0000-000000000001', 'FTC_STUDENTS', 'Season', '2026-10-01', '2027-03-31', 10),
  ('60000000-0000-0000-0000-000000000001', 'MENTORS', 'Season', '2026-10-01', '2027-04-30', 4);
-- Isolate from seed data: only this test's members are active.
update public.members set active = false;
insert into public.members (id, name, code, type, category, active) values
  ('60000000-0000-0000-0000-0000000000f1', 'FRC High', '960001', 'student', 'FRC', true),
  ('60000000-0000-0000-0000-0000000000f2', 'FRC Low', '960002', 'student', 'FRC', true),
  ('60000000-0000-0000-0000-0000000000f3', 'FRC Zero', '960003', 'student', 'FRC', true),
  ('60000000-0000-0000-0000-0000000000f4', 'FRC Inactive', '960004', 'student', 'FRC', false),
  ('60000000-0000-0000-0000-0000000000c1', 'FTC Student', '960005', 'student', 'FTC', true),
  ('60000000-0000-0000-0000-0000000000d1', 'FRC Mentor', '960006', 'mentor', 'FRC', true),
  ('60000000-0000-0000-0000-0000000000d2', 'FTC Mentor', '960007', 'mentor', 'FTC', true);
insert into public.sessions (member_id, check_in, check_out) values
  ('60000000-0000-0000-0000-0000000000f1', '2026-10-02 09:00-03', '2026-10-02 17:00-03'), -- 8 h
  ('60000000-0000-0000-0000-0000000000f2', '2026-10-03 09:00-03', '2026-10-03 13:00-03'), -- 4 h
  ('60000000-0000-0000-0000-0000000000f4', '2026-10-03 09:00-03', '2026-10-03 19:00-03'),
  ('60000000-0000-0000-0000-0000000000c1', '2026-10-03 09:00-03', '2026-10-03 19:00-03'),
  ('60000000-0000-0000-0000-0000000000d1', '2026-10-04 09:00-03', '2026-10-04 11:00-03'),
  ('60000000-0000-0000-0000-0000000000d2', '2026-10-04 09:00-03', '2026-10-04 13:00-03');

select is(
  (select array_agg(name order by "position", name) from public.ranking_unchecked('60000000-0000-0000-0000-000000000001', 'FRC_STUDENTS', '2026-10-07 12:00-03')),
  array['FRC High', 'FRC Low', 'FRC Zero'],
  '[004-AC1][004-AC2] FRC students only, ordered by %, inactive hidden, zero-hour members included');
select is(
  (select array_agg(pct_to_date order by "position") from public.ranking_unchecked('60000000-0000-0000-0000-000000000001', 'FRC_STUDENTS', '2026-10-07 12:00-03')),
  array[100.0, 50.0, 0.0],
  '[004-AC2] % to date against the FRC expectation (8 h)');
select is(
  (select array_agg(name) from public.ranking_unchecked('60000000-0000-0000-0000-000000000001', 'FTC_STUDENTS', '2026-10-07 12:00-03')),
  array['FTC Student'], '[004-AC1] FTC students compete only with FTC');
select is(
  (select array_agg(name order by "position") from public.ranking_unchecked('60000000-0000-0000-0000-000000000001', 'MENTORS', '2026-10-07 12:00-03')),
  array['FTC Mentor', 'FRC Mentor'], '[004-AC1] mentors of both categories are ranked together');
select is(
  (select row(week_minutes, phase_minutes, current_phase)::text from public.ranking_unchecked('60000000-0000-0000-0000-000000000001', 'FRC_STUDENTS', '2026-10-07 12:00-03')
   where name = 'FRC High'),
  '(0.0,480.0,Pre)', '[004-AC2] week (from Monday) and current-phase hours');

-- Ties share a position (dense rank).
update public.sessions set check_out = '2026-10-03 17:00-03' where member_id = '60000000-0000-0000-0000-0000000000f2';
select is(
  (select array_agg("position" order by name) from public.ranking_unchecked('60000000-0000-0000-0000-000000000001', 'FRC_STUDENTS', '2026-10-07 12:00-03')),
  array[1, 1, 2], '[004-AC2] equal results share a position');

select throws_ok(
  $$insert into public.season_phases (season_id, track, name, starts_on, ends_on, weekly_hours)
    values ('60000000-0000-0000-0000-000000000001', 'FRC_STUDENTS', 'Overlap', '2027-01-01', '2027-02-01', 60)$$,
  '23P01', null, '[003-AC3] overlapping phases in one track are rejected');
select lives_ok(
  $$insert into public.season_phases (season_id, track, name, starts_on, ends_on, weekly_hours)
    values ('60000000-0000-0000-0000-000000000001', 'FTC_STUDENTS', 'Same dates, other track', '2027-04-01', '2027-04-30', 10)$$,
  '[003-AC3] another track may use overlapping dates');
select throws_ok(
  $$insert into public.season_phases (season_id, track, name, starts_on, ends_on, weekly_hours)
    values ('60000000-0000-0000-0000-000000000001', 'FTC_STUDENTS', 'Too late', '2027-04-01', '2027-05-15', 10)$$,
  '23514', 'PHASE_OUTSIDE_SEASON', '[003-AC3] phases must lie inside the season');
select throws_ok(
  $$insert into public.seasons (name, starts_on, ends_on, is_current) values ('A', '2030-01-01', '2030-02-01', true), ('B', '2031-01-01', '2031-02-01', true)$$,
  '23505', null, '[003-AC1] at most one current season');

select * from finish();
rollback;
