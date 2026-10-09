-- Attendance math. Single source of truth: docs/architecture/attendance-math.md.
-- Mirrored in src/lib/attendance/ and tested against the same worked examples.

-- Local midnight (app timezone) of a calendar date, as an instant.
create function public.local_day_start(p_day date)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select p_day::timestamp at time zone public.app_timezone();
$$;

-- Minutes a session contributes inside [p_from, p_to). Open sessions count until p_now.
create function public.session_minutes(
  p_session public.sessions,
  p_from timestamptz,
  p_to timestamptz,
  p_now timestamptz default now()
)
returns numeric
language sql
stable
set search_path = ''
as $$
  select case
    when p_session.discarded then 0
    when p_session.credited_minutes is not null then
      case when p_session.check_in >= p_from and p_session.check_in < p_to
        then p_session.credited_minutes::numeric else 0 end
    else greatest(0, extract(epoch from (
      least(coalesce(p_session.check_out, p_now), p_to) - greatest(p_session.check_in, p_from)
    )) / 60)
  end;
$$;

create function public.member_worked_minutes(
  p_member_id uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_now timestamptz default now()
)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(public.session_minutes(s, p_from, p_to, p_now)), 0)
  from public.sessions s
  where s.member_id = p_member_id
    and s.check_in < p_to
    and coalesce(s.check_out, 'infinity') > p_from;
$$;

-- Expected minutes to date: each phase counts the elapsed days (the current day counts fully).
create function public.expected_minutes(
  p_season_id uuid,
  p_track public.track,
  p_at timestamptz default now()
)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  with d as (select (p_at at time zone public.app_timezone())::date as today)
  select coalesce(sum(
    p.weekly_hours * 60
    * greatest(0, least((d.today - p.starts_on) + 1, (p.ends_on - p.starts_on) + 1))
    / 7.0
  ), 0)
  from public.season_phases p, d
  where p.season_id = p_season_id and p.track = p_track;
$$;

create function public.expected_full_minutes(p_season_id uuid, p_track public.track)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(p.weekly_hours * 60 * ((p.ends_on - p.starts_on) + 1) / 7.0), 0)
  from public.season_phases p
  where p.season_id = p_season_id and p.track = p_track;
$$;

create function public.current_season_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.seasons where is_current;
$$;

create type public.ranking_row as (
  "position" integer,
  member_id uuid,
  name text,
  week_minutes numeric,
  phase_minutes numeric,
  season_minutes numeric,
  expected_minutes numeric,
  expected_full_minutes numeric,
  pct_to_date numeric,
  pct_season numeric,
  current_phase text
);

-- Full ranking for one track, without an authorization check. Not granted to any API
-- role; called by ranking() (admins) and my_stats() (members).
create function public.ranking_unchecked(
  p_season_id uuid,
  p_track public.track,
  p_at timestamptz default now()
)
returns setof public.ranking_row
language sql
stable
security definer
set search_path = ''
as $$
  with
  ctx as (
    select
      s.id,
      public.local_day_start(s.starts_on) as season_from,
      least(public.local_day_start(s.ends_on + 1), p_at) as season_to,
      date_trunc('week', p_at at time zone public.app_timezone())
        at time zone public.app_timezone() as week_from,
      public.expected_minutes(s.id, p_track, p_at) as expected,
      public.expected_full_minutes(s.id, p_track) as expected_full
    from public.seasons s
    where s.id = p_season_id
  ),
  phase as (
    select
      p.name,
      public.local_day_start(p.starts_on) as phase_from,
      least(public.local_day_start(p.ends_on + 1), p_at) as phase_to
    from public.season_phases p
    where p.season_id = p_season_id
      and p.track = p_track
      and (p_at at time zone public.app_timezone())::date between p.starts_on and p.ends_on
  ),
  totals as (
    select
      m.id as member_id,
      m.name,
      public.member_worked_minutes(m.id, ctx.week_from, p_at, p_at) as week_minutes,
      (select public.member_worked_minutes(m.id, phase.phase_from, phase.phase_to, p_at) from phase) as phase_minutes,
      public.member_worked_minutes(m.id, ctx.season_from, ctx.season_to, p_at) as season_minutes,
      ctx.expected,
      ctx.expected_full,
      (select phase.name from phase) as current_phase
    from public.members m, ctx
    where m.active and public.member_track(m.type, m.category) = p_track
  ),
  pct as (
    select
      t.*,
      round(t.season_minutes / nullif(t.expected, 0) * 100, 1) as pct_to_date,
      round(t.season_minutes / nullif(t.expected_full, 0) * 100, 1) as pct_season
    from totals t
  )
  select
    (dense_rank() over (order by pct.pct_to_date desc nulls last, pct.season_minutes desc))::integer,
    pct.member_id,
    pct.name,
    round(pct.week_minutes, 1),
    round(pct.phase_minutes, 1),
    round(pct.season_minutes, 1),
    round(pct.expected, 1),
    round(pct.expected_full, 1),
    pct.pct_to_date,
    pct.pct_season,
    pct.current_phase
  from pct
  order by 1, pct.name;
$$;

-- Ranking for admins (004-AC1, AC2, AC9).
create function public.ranking(
  p_season_id uuid,
  p_track public.track,
  p_at timestamptz default now()
)
returns setof public.ranking_row
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  return query select * from public.ranking_unchecked(p_season_id, p_track, p_at);
end;
$$;

-- The caller's own stats and position in their track (005-AC1). Never returns other members.
create function public.my_stats(
  p_season_id uuid default null,
  p_at timestamptz default now()
)
returns table (
  track public.track,
  "position" integer,
  total integer,
  week_minutes numeric,
  phase_minutes numeric,
  season_minutes numeric,
  expected_minutes numeric,
  expected_full_minutes numeric,
  pct_to_date numeric,
  pct_season numeric,
  current_phase text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_member public.members;
  v_track public.track;
  v_season uuid := coalesce(p_season_id, public.current_season_id());
begin
  select * into v_member from public.members where user_id = (select auth.uid());
  if not found then
    raise exception 'NOT_A_MEMBER' using errcode = '42501';
  end if;
  if v_season is null then
    return;
  end if;
  v_track := public.member_track(v_member.type, v_member.category);

  return query
  with r as (select * from public.ranking_unchecked(v_season, v_track, p_at))
  select
    v_track, r."position", (select count(*)::integer from r),
    r.week_minutes, r.phase_minutes, r.season_minutes, r.expected_minutes,
    r.expected_full_minutes, r.pct_to_date, r.pct_season, r.current_phase
  from r
  where r.member_id = v_member.id;
end;
$$;
