-- Invites and registration (spec 002).
begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

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
  ('30000000-0000-0000-0000-0000000000ad', 'admin@test.local'),
  ('30000000-0000-0000-0000-0000000000b1', 'student1@test.local'),
  ('30000000-0000-0000-0000-0000000000b2', 'student2@test.local'),
  ('30000000-0000-0000-0000-0000000000b3', 'student3@test.local');
insert into public.admins (user_id) values ('30000000-0000-0000-0000-0000000000ad');

-- Store tokens for later steps (as postgres, outside RLS).
create temp table t (name text primary key, token text);
grant all on t to authenticated;

select pg_temp.login('30000000-0000-0000-0000-0000000000ad');
insert into t select 'single', token from public.create_invite('student', null, 'Single use', 1, 7);
insert into t select 'ftc', token from public.create_invite('mentor', 'FTC', 'FTC mentors', 5, 7);
select pg_temp.logout();

select is((select count(*)::integer from public.invites i join t on i.token_hash = t.token), 0,
  '[002-AC1] the plain token is never stored');
select is((select count(*)::integer from public.invites i join t on i.token_hash = public.hash_invite_token(t.token)), 2,
  '[002-AC1] only the token hash is stored');

select pg_temp.login('30000000-0000-0000-0000-0000000000b1');
select throws_ok($$select public.create_invite('mentor')$$, '42501', 'FORBIDDEN', 'only admins create invites');
select pg_temp.logout();

select is(public.invite_preview((select token from t where name = 'ftc')),
  '{"valid": true, "type": "mentor", "category": "FTC"}'::jsonb, '[002-AC2] preview shows type and fixed category');
select is(public.invite_preview('not-a-token'), '{"valid": false}'::jsonb, '[002-AC5] an unknown token is invalid');

select throws_ok($$select public.redeem_invite((select token from t where name = 'single'), 'Nobody', 'FRC')$$,
  '42501', 'NOT_AUTHENTICATED', 'redeeming requires a logged-in user');

select pg_temp.login('30000000-0000-0000-0000-0000000000b1');
select is(
  (select row(type, category, code, locale)::text from public.redeem_invite((select token from t where name = 'single'), '  Student One ', 'FTC', '444444', 'en')),
  '(student,FTC,444444,en)', '[002-AC3][002-AC10] redemption creates the member with the invite type, chosen category, code and language');
select pg_temp.logout();

select is((select uses from public.invites i join t on i.token_hash = public.hash_invite_token(t.token) where t.name = 'single'), 1,
  '[002-AC3] redemption consumes one use');
select is((select name from public.members where user_id = '30000000-0000-0000-0000-0000000000b1'), 'Student One',
  'the name is trimmed');

select pg_temp.login('30000000-0000-0000-0000-0000000000b2');
select throws_ok($$select public.redeem_invite((select token from t where name = 'single'), 'Student Two', 'FRC')$$,
  'P0001', 'INVITE_INVALID', '[002-AC5] a used-up invite is rejected');
select throws_ok($$select public.redeem_invite((select token from t where name = 'ftc'), 'Student Two', 'FRC')$$,
  'P0001', 'CATEGORY_MISMATCH', '[002-AC3] a fixed category cannot be changed');
select throws_ok($$select public.redeem_invite((select token from t where name = 'ftc'), 'Student Two', null, '444444')$$,
  'P0001', 'CODE_IN_USE', '[002-AC4] a duplicate entrance code is rejected');
select matches(
  (select code from public.redeem_invite((select token from t where name = 'ftc'), 'Mentor Two')),
  '^[0-9]{6}$', '[002-AC3] an empty code is generated automatically');
select throws_ok($$select public.redeem_invite((select token from t where name = 'ftc'), 'Again')$$,
  'P0001', 'ALREADY_MEMBER', '[002-AC6] a user who is already a member cannot redeem again');
select pg_temp.logout();

update public.invites set expires_at = now() - interval '1 minute'
where token_hash = public.hash_invite_token((select token from t where name = 'ftc'));
select pg_temp.login('30000000-0000-0000-0000-0000000000b3');
select throws_ok($$select public.redeem_invite((select token from t where name = 'ftc'), 'Late Mentor')$$,
  'P0001', 'INVITE_INVALID', '[002-AC5] an expired invite is rejected');
select pg_temp.logout();

select * from finish();
rollback;
