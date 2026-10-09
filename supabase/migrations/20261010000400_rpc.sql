-- Business operations as SQL functions. Errors are raised as stable English codes
-- (e.g. CODE_IN_USE) that the UI translates (ADR 0006).

---------------------------------------------------------------------------
-- Kiosk (spec 001) — service role only, called by kiosk server actions.
---------------------------------------------------------------------------

-- Opens or closes the session of the member with this code (001-AC1, AC2, AC4, AC5).
-- Repeats within 5 seconds are ignored, so a double Enter doesn't undo a check-in.
create function public.kiosk_toggle(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member public.members;
  v_open public.sessions;
begin
  select * into v_member from public.members where code = p_code and active for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'CODE_NOT_FOUND');
  end if;

  select * into v_open from public.sessions where member_id = v_member.id and check_out is null;

  if found then
    if v_open.check_in > now() - interval '5 seconds' then
      return jsonb_build_object('ok', true, 'action', 'noop', 'member_id', v_member.id,
        'name', v_member.name, 'locale', v_member.locale);
    end if;
    update public.sessions set check_out = now() where id = v_open.id;
    return jsonb_build_object('ok', true, 'action', 'out', 'member_id', v_member.id,
      'name', v_member.name, 'locale', v_member.locale,
      'minutes', round(extract(epoch from now() - v_open.check_in) / 60));
  end if;

  if exists (
    select 1 from public.sessions
    where member_id = v_member.id and check_out > now() - interval '5 seconds'
  ) then
    return jsonb_build_object('ok', true, 'action', 'noop', 'member_id', v_member.id,
      'name', v_member.name, 'locale', v_member.locale);
  end if;

  insert into public.sessions (member_id) values (v_member.id);
  return jsonb_build_object('ok', true, 'action', 'in', 'member_id', v_member.id,
    'name', v_member.name, 'locale', v_member.locale);
end;
$$;

-- Closes a member's open session from the "in the lab" grid (001-AC3).
create function public.kiosk_checkout(p_member_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member public.members;
  v_open public.sessions;
begin
  select * into v_member from public.members where id = p_member_id for update;
  select * into v_open from public.sessions where member_id = p_member_id and check_out is null;
  if v_member.id is null or v_open.id is null then
    return jsonb_build_object('ok', false, 'error', 'NO_OPEN_SESSION');
  end if;
  update public.sessions set check_out = now() where id = v_open.id;
  return jsonb_build_object('ok', true, 'action', 'out', 'member_id', v_member.id,
    'name', v_member.name, 'locale', v_member.locale,
    'minutes', round(extract(epoch from now() - v_open.check_in) / 60));
end;
$$;

-- Who is in the lab: names and check-in times only (ADR 0005).
create function public.kiosk_present()
returns table (member_id uuid, name text, check_in timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, m.name, s.check_in
  from public.sessions s
  join public.members m on m.id = s.member_id
  where s.check_out is null and not s.discarded
  order by s.check_in;
$$;

---------------------------------------------------------------------------
-- Invites (spec 002)
---------------------------------------------------------------------------

create function public.hash_invite_token(p_token text)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(extensions.digest(p_token, 'sha256'), 'hex');
$$;

-- Creates an invite and returns its token once; only the hash is stored (002-AC1).
create function public.create_invite(
  p_type public.member_type,
  p_category public.category default null,
  p_label text default '',
  p_max_uses integer default 1,
  p_expires_in_days integer default 7
)
returns table (id uuid, token text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text;
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if p_expires_in_days not between 1 and 90 then
    raise exception 'INVALID_EXPIRY' using errcode = '22023';
  end if;
  v_token := rtrim(translate(encode(extensions.gen_random_bytes(32), 'base64'), '+/', '-_'), '=');
  insert into public.invites (token_hash, label, type, category, max_uses, expires_at, created_by)
  values (public.hash_invite_token(v_token), coalesce(p_label, ''), p_type, p_category, p_max_uses,
    now() + make_interval(days => p_expires_in_days), auth.uid())
  returning invites.id into v_id;
  return query select v_id, v_token;
end;
$$;

-- What the invite page may show before signup (002-AC2). Never returns other data.
create function public.invite_preview(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select jsonb_build_object('valid', true, 'type', i.type, 'category', i.category)
     from public.invites i
     where i.token_hash = public.hash_invite_token(p_token)
       and i.revoked_at is null and i.expires_at > now() and i.uses < i.max_uses),
    jsonb_build_object('valid', false)
  );
$$;

-- Creates the caller's member profile from an invite (002-AC3–AC6, AC10).
create function public.redeem_invite(
  p_token text,
  p_name text,
  p_category public.category default null,
  p_code text default null,
  p_locale text default 'pt-BR'
)
returns public.members
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_invite public.invites;
  v_category public.category;
  v_code text := nullif(btrim(coalesce(p_code, '')), '');
  v_member public.members;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '42501';
  end if;
  if exists (select 1 from public.members where user_id = v_uid) then
    raise exception 'ALREADY_MEMBER' using errcode = 'P0001';
  end if;

  select * into v_invite from public.invites
  where token_hash = public.hash_invite_token(p_token)
  for update;
  if not found or v_invite.revoked_at is not null or v_invite.expires_at <= now()
    or v_invite.uses >= v_invite.max_uses then
    raise exception 'INVITE_INVALID' using errcode = 'P0001';
  end if;

  if v_invite.category is not null and p_category is not null and p_category <> v_invite.category then
    raise exception 'CATEGORY_MISMATCH' using errcode = 'P0001';
  end if;
  v_category := coalesce(v_invite.category, p_category);
  if v_category is null then
    raise exception 'CATEGORY_REQUIRED' using errcode = 'P0001';
  end if;

  if v_code is null then
    loop
      v_code := lpad((floor(random() * 1000000))::integer::text, 6, '0');
      exit when not exists (select 1 from public.members where code = v_code);
    end loop;
  elsif v_code !~ '^[0-9]{6}$' then
    raise exception 'CODE_INVALID' using errcode = 'P0001';
  elsif exists (select 1 from public.members where code = v_code) then
    raise exception 'CODE_IN_USE' using errcode = 'P0001';
  end if;

  if p_locale not in ('pt-BR', 'en') then
    raise exception 'LOCALE_INVALID' using errcode = 'P0001';
  end if;

  insert into public.members (user_id, name, code, type, category, locale, invite_id)
  values (v_uid, btrim(p_name), v_code, v_invite.type, v_category, p_locale, v_invite.id)
  returning * into v_member;

  update public.invites set uses = uses + 1 where id = v_invite.id;
  return v_member;
end;
$$;

---------------------------------------------------------------------------
-- Auto-close and corrections (spec 006, ADR 0003)
---------------------------------------------------------------------------

-- Closes sessions still open that started before the most recent cutoff instant
-- (default 04:00 local). Uses the fixed cutoff, never the run time (006-AC1, AC2).
create function public.close_stale_sessions(p_now timestamptz default now())
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tz text := public.app_timezone();
  v_time time := coalesce((select (value #>> '{}')::time from public.settings where key = 'auto_close_time'), '04:00');
  v_cutoff timestamptz;
  v_closed integer;
begin
  v_cutoff := ((p_now at time zone v_tz)::date + v_time) at time zone v_tz;
  if v_cutoff > p_now then
    v_cutoff := v_cutoff - interval '1 day';
  end if;

  update public.sessions
  set check_out = v_cutoff, auto_closed = true, credited_minutes = 0
  where check_out is null and check_in < v_cutoff;
  get diagnostics v_closed = row_count;
  return v_closed;
end;
$$;

-- A member asks to fix the exit time of their own auto-closed session (006-AC3).
create function public.request_correction(
  p_session_id uuid,
  p_check_out timestamptz,
  p_note text default null
)
returns public.correction_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member_id uuid := public.current_member_id();
  v_session public.sessions;
  v_request public.correction_requests;
begin
  select * into v_session from public.sessions where id = p_session_id;
  if v_member_id is null or not found or v_session.member_id <> v_member_id then
    raise exception 'SESSION_NOT_FOUND' using errcode = 'P0001';
  end if;
  if not v_session.auto_closed or v_session.credited_minutes is distinct from 0 then
    raise exception 'NOT_CORRECTABLE' using errcode = 'P0001';
  end if;
  if p_check_out <= v_session.check_in or p_check_out > v_session.check_out then
    raise exception 'INVALID_TIME' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.correction_requests where session_id = p_session_id and status = 'pending') then
    raise exception 'ALREADY_PENDING' using errcode = 'P0001';
  end if;

  insert into public.correction_requests (session_id, member_id, requested_check_out, note)
  values (p_session_id, v_member_id, p_check_out, nullif(btrim(coalesce(p_note, '')), ''))
  returning * into v_request;
  return v_request;
end;
$$;

-- An admin approves or rejects a correction (006-AC4).
create function public.review_correction(p_request_id uuid, p_approve boolean)
returns public.correction_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.correction_requests;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  select * into v_request from public.correction_requests where id = p_request_id for update;
  if not found or v_request.status <> 'pending' then
    raise exception 'REQUEST_NOT_PENDING' using errcode = 'P0001';
  end if;

  if p_approve then
    update public.sessions
    set check_out = v_request.requested_check_out, credited_minutes = null
    where id = v_request.session_id;
  end if;

  update public.correction_requests
  set status = case when p_approve then 'approved'::public.request_status else 'rejected'::public.request_status end,
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = p_request_id
  returning * into v_request;
  return v_request;
end;
$$;

---------------------------------------------------------------------------
-- Seasons (spec 003)
---------------------------------------------------------------------------

create function public.set_current_season(p_season_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  update public.seasons set is_current = false where is_current and id <> p_season_id;
  update public.seasons set is_current = true where id = p_season_id;
  if not found then
    raise exception 'SEASON_NOT_FOUND' using errcode = 'P0001';
  end if;
end;
$$;

---------------------------------------------------------------------------
-- Audit log (006-AC6): every change made by a logged-in user.
-- Kiosk and cron run without a user (service role), and their effects are the sessions themselves.
---------------------------------------------------------------------------

create function public.audit_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row jsonb := to_jsonb(coalesce(new, old));
begin
  if auth.uid() is null then
    return coalesce(new, old);
  end if;
  insert into public.audit_log (actor, action, entity, entity_id, before, after)
  values (
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    coalesce(v_row ->> 'id', v_row ->> 'user_id', v_row ->> 'key'),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

create trigger audit after insert or update or delete on public.members for each row execute function public.audit_row();
create trigger audit after insert or update or delete on public.admins for each row execute function public.audit_row();
create trigger audit after insert or update or delete on public.invites for each row execute function public.audit_row();
create trigger audit after insert or update or delete on public.sessions for each row execute function public.audit_row();
create trigger audit after insert or update or delete on public.correction_requests for each row execute function public.audit_row();
create trigger audit after insert or update or delete on public.seasons for each row execute function public.audit_row();
create trigger audit after insert or update or delete on public.season_phases for each row execute function public.audit_row();
create trigger audit after insert or update or delete on public.settings for each row execute function public.audit_row();
