-- Local development seed (runs on `supabase db reset`; never pushed to staging/prod).
-- Season and FRC phases match the worked examples in docs/architecture/attendance-math.md.

insert into public.seasons (id, name, starts_on, ends_on, is_current) values
  ('00000000-0000-4000-8000-000000002026', '2026–2027', '2026-10-01', '2027-04-30', true);

insert into public.season_phases (season_id, track, name, starts_on, ends_on, weekly_hours) values
  ('00000000-0000-4000-8000-000000002026', 'FRC_STUDENTS', 'Pré-temporada', '2026-10-01', '2027-01-08', 8),
  ('00000000-0000-4000-8000-000000002026', 'FRC_STUDENTS', 'Build season', '2027-01-09', '2027-02-28', 60),
  ('00000000-0000-4000-8000-000000002026', 'FRC_STUDENTS', 'Competições', '2027-03-01', '2027-04-30', 42),
  -- Demo values; admins configure the real FTC and mentor phases in the UI (spec 003).
  ('00000000-0000-4000-8000-000000002026', 'FTC_STUDENTS', 'Temporada FTC', '2026-10-01', '2027-03-31', 10),
  ('00000000-0000-4000-8000-000000002026', 'MENTORS', 'Temporada', '2026-10-01', '2027-04-30', 6);

-- Demo members without accounts, for trying the kiosk locally.
insert into public.members (name, code, type, category) values
  ('Ana FRC (demo)', '111111', 'student', 'FRC'),
  ('Bruno FRC (demo)', '111112', 'student', 'FRC'),
  ('Carla FTC (demo)', '222221', 'student', 'FTC'),
  ('Diego FTC (demo)', '222222', 'student', 'FTC'),
  ('Elisa Mentora (demo)', '333331', 'mentor', 'FRC'),
  ('Fábio Mentor (demo)', '333332', 'mentor', 'FTC');

-- Local auth accounts for the dev login (ENABLE_DEV_LOGIN, local/CI only; ADR 0008).
-- Password for both: "devpassword". The email provider is disabled in staging/prod.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-8000-0000000000ad', 'authenticated', 'authenticated',
   'admin@local.test', extensions.crypt('devpassword', extensions.gen_salt('bf')), now(),
   '{"provider": "email", "providers": ["email"]}', '{"full_name": "Admin Local"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated',
   'ana@local.test', extensions.crypt('devpassword', extensions.gen_salt('bf')), now(),
   '{"provider": "email", "providers": ["email"]}', '{"full_name": "Ana FRC"}', now(), now(), '', '', '', '');

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true), 'email', now(), now(), now()
from auth.users u
where u.email in ('admin@local.test', 'ana@local.test');

insert into public.admins (user_id) values ('a0000000-0000-4000-8000-0000000000ad');
insert into public.members (user_id, name, code, type, category) values
  ('a0000000-0000-4000-8000-0000000000ad', 'Admin Local', '999001', 'mentor', 'FRC');
update public.members set user_id = 'a0000000-0000-4000-8000-0000000000a1' where code = '111111';
-- Carla prefers English: the kiosk greets her in English even when it is in Portuguese (001-AC10).
update public.members set locale = 'en' where code = '222221';

-- A few past sessions so "Minha presença" and the rankings have data (local São Paulo times).
insert into public.sessions (member_id, check_in, check_out)
select m.id, (d + time '14:00') at time zone 'America/Sao_Paulo', (d + time '18:00') at time zone 'America/Sao_Paulo'
from public.members m, (values (date '2026-10-01'), (date '2026-10-03'), (date '2026-10-06')) as v(d)
where m.code = '111111';
insert into public.sessions (member_id, check_in, check_out)
select m.id, (date '2026-10-03' + time '14:00') at time zone 'America/Sao_Paulo', (date '2026-10-03' + time '16:00') at time zone 'America/Sao_Paulo'
from public.members m where m.code = '111112';
