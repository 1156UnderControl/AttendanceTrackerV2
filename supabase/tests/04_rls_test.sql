-- Row-level isolation and admin-only operations (004-AC9, 005-AC4, 005-AC5, 006-AC6, 002-AC8).
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
  ('40000000-0000-0000-0000-0000000000ad', 'admin@test.local'),
  ('40000000-0000-0000-0000-0000000000a1', 'a@test.local'),
  ('40000000-0000-0000-0000-0000000000b1', 'b@test.local');
insert into public.admins (user_id) values ('40000000-0000-0000-0000-0000000000ad');
-- Isolate from seed data: only this test's members are active.
update public.members set active = false;
insert into public.members (id, user_id, name, code, type, category) values
  ('40000000-0000-0000-0000-00000000000a', '40000000-0000-0000-0000-0000000000a1', 'Member A', '940001', 'student', 'FRC'),
  ('40000000-0000-0000-0000-00000000000b', '40000000-0000-0000-0000-0000000000b1', 'Member B', '940002', 'student', 'FRC');
insert into public.sessions (member_id, check_in, check_out) values
  ('40000000-0000-0000-0000-00000000000a', now() - interval '5 hours', now() - interval '4 hours'),
  ('40000000-0000-0000-0000-00000000000b', now() - interval '3 hours', now() - interval '1 hour');
insert into public.seasons (id, name, starts_on, ends_on) values
  ('40000000-0000-0000-0000-000000000001', 'RLS test', current_date - 30, current_date + 30);

-- Member A
select pg_temp.login('40000000-0000-0000-0000-0000000000a1');
select is((select array_agg(member_id) from public.sessions), array['40000000-0000-0000-0000-00000000000a'::uuid],
  '[005-AC5] a member sees only their own sessions');
select is((select array_agg(name) from public.members), array['Member A'], '[005-AC5] a member sees only their own profile');
select is((select count(*)::integer from public.audit_log), 0, 'a member cannot read the audit log');
select throws_ok($$select * from public.ranking('40000000-0000-0000-0000-000000000001', 'FRC_STUDENTS')$$,
  '42501', 'FORBIDDEN', '[004-AC9] the full ranking is admin-only');
select is((select total from public.my_stats('40000000-0000-0000-0000-000000000001')), 2,
  '[005-AC1] my_stats returns the caller''s position out of their track size');

update public.members set name = 'Member A Renamed', code = '940011', locale = 'en' where id = '40000000-0000-0000-0000-00000000000a';
select is((select name from public.members where id = '40000000-0000-0000-0000-00000000000a'), 'Member A Renamed',
  '[005-AC4] a member can edit their own name, code and language');
select throws_ok($$update public.members set category = 'FTC' where id = '40000000-0000-0000-0000-00000000000a'$$,
  '42501', 'FORBIDDEN_FIELD', '[005-AC4] a member cannot change their own category');
update public.members set name = 'Hacked' where id = '40000000-0000-0000-0000-00000000000b';
select throws_ok($$insert into public.sessions (member_id, check_in) values ('40000000-0000-0000-0000-00000000000a', now())$$,
  '42501', null, 'a member cannot create sessions directly');
select pg_temp.logout();

select is((select name from public.members where id = '40000000-0000-0000-0000-00000000000b'), 'Member B',
  '[005-AC5] a member cannot edit another member');

-- Anonymous
select set_config('request.jwt.claims', '', true);
set local role anon;
select throws_ok($$select * from public.members$$, '42501', null, 'anon cannot read members');
reset role;

-- Admin
select pg_temp.login('40000000-0000-0000-0000-0000000000ad');
select is((select count(*)::integer from public.sessions where member_id in
  ('40000000-0000-0000-0000-00000000000a', '40000000-0000-0000-0000-00000000000b')), 2, 'an admin sees all sessions');
select is((select count(*)::integer from public.ranking('40000000-0000-0000-0000-000000000001', 'FRC_STUDENTS')), 2,
  '[004-AC9] an admin can read the ranking');
update public.members set category = 'FTC' where id = '40000000-0000-0000-0000-00000000000b';
delete from public.admins where user_id = '40000000-0000-0000-0000-0000000000ad';
select is((select count(*)::integer from public.admins where user_id = '40000000-0000-0000-0000-0000000000ad'), 1,
  '[002-AC8] an admin cannot revoke their own admin rights');
select pg_temp.logout();

select is(
  (select row(actor, action, before ->> 'category', after ->> 'category')::text from public.audit_log
   where entity = 'members' and entity_id = '40000000-0000-0000-0000-00000000000b'),
  '(40000000-0000-0000-0000-0000000000ad,update,FRC,FTC)',
  '[006-AC6] admin changes are audited with actor and before/after values');
select is((select count(*)::integer from public.audit_log where entity = 'members' and entity_id = '40000000-0000-0000-0000-00000000000a'), 1,
  'member self-edits are audited too');

select * from finish();
rollback;
