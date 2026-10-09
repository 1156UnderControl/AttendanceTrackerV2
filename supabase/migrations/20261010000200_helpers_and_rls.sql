-- Helper functions, guard triggers, grants and RLS (data-model.md, "RLS policy matrix").
-- Every security definer function pins search_path to '' and fully qualifies names.

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

create function public.current_member_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.members where user_id = (select auth.uid());
$$;

create function public.app_timezone()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select value #>> '{}' from public.settings where key = 'timezone'), 'America/Sao_Paulo');
$$;

-- A student's track is their category; every mentor is in MENTORS (ADR 0004).
create function public.member_track(p_type public.member_type, p_category public.category)
returns public.track
language sql
immutable
set search_path = ''
as $$
  select case
    when p_type = 'mentor' then 'MENTORS'::public.track
    when p_category = 'FRC' then 'FRC_STUDENTS'::public.track
    else 'FTC_STUDENTS'::public.track
  end;
$$;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger members_set_updated_at before update on public.members
  for each row execute function public.set_updated_at();

-- Members may edit only their own name, code and locale (005-AC4). Admins edit anything.
-- Applies to direct table updates by logged-in users; security definer functions run as
-- the owner and are not affected.
create function public.members_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user = 'authenticated' and not public.is_admin() then
    if new.type is distinct from old.type
      or new.category is distinct from old.category
      or new.active is distinct from old.active
      or new.user_id is distinct from old.user_id
      or new.invite_id is distinct from old.invite_id then
      raise exception 'FORBIDDEN_FIELD' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger members_guard before update on public.members
  for each row execute function public.members_guard();

-- Phases must lie inside their season (003-AC3).
create function public.season_phases_within_season()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.seasons s
    where s.id = new.season_id and new.starts_on >= s.starts_on and new.ends_on <= s.ends_on
  ) then
    raise exception 'PHASE_OUTSIDE_SEASON' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger season_phases_within_season before insert or update on public.season_phases
  for each row execute function public.season_phases_within_season();

-- Grants: authenticated users get table privileges; RLS decides which rows.
-- anon gets nothing (invite_preview is the only anon entry point).
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on
  public.members, public.admins, public.invites, public.sessions,
  public.correction_requests, public.seasons, public.season_phases, public.settings
  to authenticated;
grant select on public.audit_log to authenticated;


alter table public.settings enable row level security;
alter table public.admins enable row level security;
alter table public.invites enable row level security;
alter table public.members enable row level security;
alter table public.sessions enable row level security;
alter table public.correction_requests enable row level security;
alter table public.seasons enable row level security;
alter table public.season_phases enable row level security;
alter table public.audit_log enable row level security;

-- members
create policy "members: read own or admin" on public.members for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "members: admin insert" on public.members for insert to authenticated
  with check ((select public.is_admin()));
create policy "members: update own or admin" on public.members for update to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()))
  with check (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "members: admin delete" on public.members for delete to authenticated
  using ((select public.is_admin()));

-- admins (an admin can't remove their own admin rights, 002-AC8)
create policy "admins: read own or admin" on public.admins for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "admins: admin insert" on public.admins for insert to authenticated
  with check ((select public.is_admin()));
create policy "admins: admin delete others" on public.admins for delete to authenticated
  using ((select public.is_admin()) and user_id <> (select auth.uid()));

-- invites: admins only
create policy "invites: admin all" on public.invites for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- sessions: members read their own; only admins write directly
create policy "sessions: read own or admin" on public.sessions for select to authenticated
  using (member_id = (select public.current_member_id()) or (select public.is_admin()));
create policy "sessions: admin insert" on public.sessions for insert to authenticated
  with check ((select public.is_admin()));
create policy "sessions: admin update" on public.sessions for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "sessions: admin delete" on public.sessions for delete to authenticated
  using ((select public.is_admin()));

-- correction_requests: members read their own and create via request_correction()
create policy "corrections: read own or admin" on public.correction_requests for select to authenticated
  using (member_id = (select public.current_member_id()) or (select public.is_admin()));
create policy "corrections: admin write" on public.correction_requests for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- seasons, phases, settings: everyone logged in reads; admins write
create policy "seasons: read" on public.seasons for select to authenticated using (true);
create policy "seasons: admin write" on public.seasons for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "phases: read" on public.season_phases for select to authenticated using (true);
create policy "phases: admin write" on public.season_phases for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "settings: read" on public.settings for select to authenticated using (true);
create policy "settings: admin write" on public.settings for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- audit_log: admins read; rows are written only by the audit trigger
create policy "audit: admin read" on public.audit_log for select to authenticated
  using ((select public.is_admin()));
