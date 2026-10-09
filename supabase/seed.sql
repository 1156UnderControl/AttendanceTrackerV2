-- Local development seed (runs on `supabase db reset`; never pushed to staging/prod).
-- Season and FRC phases match the worked examples in docs/architecture/attendance-math.md.

insert into public.seasons (id, name, starts_on, ends_on, is_current) values
  ('00000000-0000-0000-0000-000000002026', '2026–2027', '2026-10-01', '2027-04-30', true);

insert into public.season_phases (season_id, track, name, starts_on, ends_on, weekly_hours) values
  ('00000000-0000-0000-0000-000000002026', 'FRC_STUDENTS', 'Pré-temporada', '2026-10-01', '2027-01-08', 8),
  ('00000000-0000-0000-0000-000000002026', 'FRC_STUDENTS', 'Build season', '2027-01-09', '2027-02-28', 60),
  ('00000000-0000-0000-0000-000000002026', 'FRC_STUDENTS', 'Competições', '2027-03-01', '2027-04-30', 42),
  -- Demo values; admins configure the real FTC and mentor phases in the UI (spec 003).
  ('00000000-0000-0000-0000-000000002026', 'FTC_STUDENTS', 'Temporada FTC', '2026-10-01', '2027-03-31', 10),
  ('00000000-0000-0000-0000-000000002026', 'MENTORS', 'Temporada', '2026-10-01', '2027-04-30', 6);

-- Demo members without accounts, for trying the kiosk locally.
insert into public.members (name, code, type, category) values
  ('Ana FRC (demo)', '111111', 'student', 'FRC'),
  ('Bruno FRC (demo)', '111112', 'student', 'FRC'),
  ('Carla FTC (demo)', '222221', 'student', 'FTC'),
  ('Diego FTC (demo)', '222222', 'student', 'FTC'),
  ('Elisa Mentora (demo)', '333331', 'mentor', 'FRC'),
  ('Fábio Mentor (demo)', '333332', 'mentor', 'FTC');
