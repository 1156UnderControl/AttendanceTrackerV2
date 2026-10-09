-- Core schema for AttendanceTrackerV2.
-- Design: docs/architecture/data-model.md · Spec: specs/008-database-foundation

-- Cloud projects don't expose new objects automatically (data-model.md, "Exposure
-- and RLS defaults"). Make local match: nothing is granted unless a migration says so.
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
-- Functions: Postgres grants EXECUTE to PUBLIC globally, which a schema-scoped default
-- can't remove. Function privileges are therefore set explicitly in 20261010000500.
alter default privileges for role postgres in schema public revoke execute on functions from anon, authenticated;

create extension if not exists btree_gist with schema extensions;
create extension if not exists pgcrypto with schema extensions;

create type public.member_type as enum ('student', 'mentor');
create type public.category as enum ('FRC', 'FTC');
create type public.track as enum ('FRC_STUDENTS', 'FTC_STUDENTS', 'MENTORS');
create type public.request_status as enum ('pending', 'approved', 'rejected');

-- Key/value settings (data-model.md, "Settings").
create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.settings (key, value) values
  ('timezone', '"America/Sao_Paulo"'),
  ('auto_close_time', '"04:00"'),
  ('color_thresholds', '{"green": 100, "yellow": 75}'),
  ('default_locale', '"pt-BR"');

create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  label text not null default '' check (char_length(label) <= 80),
  type public.member_type not null,
  category public.category, -- null = the invitee chooses
  max_uses integer not null default 1 check (max_uses between 1 and 200),
  uses integer not null default 0 check (uses >= 0 and uses <= max_uses),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  -- Nullable so attendance history survives account deletion (NFR-9).
  user_id uuid unique references auth.users (id) on delete set null,
  name text not null check (char_length(btrim(name)) between 2 and 80),
  code text not null unique check (code ~ '^[0-9]{6}$'),
  type public.member_type not null,
  category public.category not null,
  locale text not null default 'pt-BR' check (locale in ('pt-BR', 'en')),
  active boolean not null default true,
  invite_id uuid references public.invites (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  check_in timestamptz not null default now(),
  check_out timestamptz, -- null = open
  auto_closed boolean not null default false,
  credited_minutes integer check (credited_minutes >= 0), -- null = use the real duration
  discarded boolean not null default false,
  created_at timestamptz not null default now(),
  check (check_out is null or check_out > check_in),
  -- No overlapping sessions per member (006-AC5); open sessions extend to infinity.
  constraint sessions_no_overlap exclude using gist (
    member_id with =,
    tstzrange(check_in, coalesce(check_out, 'infinity'), '[)') with &&
  ) where (not discarded)
);

-- One open session per member (001-AC5).
create unique index sessions_one_open_per_member on public.sessions (member_id) where check_out is null;
create index sessions_member_check_in on public.sessions (member_id, check_in);

create table public.correction_requests (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  requested_check_out timestamptz not null,
  note text check (char_length(note) <= 500),
  status public.request_status not null default 'pending',
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- One pending request per session (006-AC3).
create unique index correction_requests_one_pending on public.correction_requests (session_id) where status = 'pending';

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(btrim(name)) between 1 and 40),
  starts_on date not null,
  ends_on date not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

-- At most one current season (003-AC1).
create unique index seasons_one_current on public.seasons ((true)) where is_current;

create table public.season_phases (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete cascade,
  track public.track not null,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  starts_on date not null,
  ends_on date not null,
  weekly_hours numeric(5, 2) not null check (weekly_hours >= 0 and weekly_hours <= 168),
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on),
  -- No overlapping phases within a track (003-AC3).
  constraint season_phases_no_overlap exclude using gist (
    season_id with =,
    track with =,
    daterange(starts_on, ends_on, '[]') with &&
  )
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor uuid,
  action text not null,
  entity text not null,
  entity_id text,
  before jsonb,
  after jsonb,
  at timestamptz not null default now()
);

create index audit_log_at on public.audit_log (at desc);
