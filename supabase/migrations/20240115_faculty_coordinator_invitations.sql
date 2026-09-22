-- Department coordinators can invite faculty coordinators for their department.

alter table "CoordinatorInvitation"
  add column if not exists "institutionId" text references "Institution" (id) on delete set null,
  add column if not exists "facultyId" text references "FacultySchool" (id) on delete set null,
  add column if not exists "departmentId" text references "Department" (id) on delete set null;

drop policy if exists "Department coordinators create faculty invitations" on "CoordinatorInvitation";
create policy "Department coordinators create faculty invitations" on "CoordinatorInvitation"
  for insert to authenticated
  with check (
    public.get_my_role() = 'DEPARTMENT_COORDINATOR'
    and "createdById" = auth.uid()::text
    and role = 'FACULTY_COORDINATOR'
    and "departmentId" = (select "departmentId" from "User" where id = auth.uid()::text)
  );

drop policy if exists "Department coordinators read own faculty invitations" on "CoordinatorInvitation";
create policy "Department coordinators read own faculty invitations" on "CoordinatorInvitation"
  for select to authenticated
  using ("createdById" = auth.uid()::text or public.get_my_role() = 'ADMIN');

create or replace function public.activate_coordinator_invitation(
  p_raw_token text,
  p_user_id text,
  p_user_email text,
  p_user_name text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv "CoordinatorInvitation"%rowtype;
  v_user_id text;
  v_role text;
begin
  select * into v_inv from "CoordinatorInvitation"
  where "tokenHash" = encode(sha256(convert_to(coalesce(p_raw_token, ''), 'UTF8')), 'hex') limit 1;
  if v_inv.id is null then return jsonb_build_object('success', false, 'message', 'Invalid invitation link.'); end if;
  if v_inv.status in ('ACTIVATED', 'ACTIVE') or v_inv."activatedAt" is not null then return jsonb_build_object('success', false, 'message', 'This invitation has already been used.'); end if;
  if v_inv."tokenExpiresAt" is not null and v_inv."tokenExpiresAt" < now() then return jsonb_build_object('success', false, 'message', 'This invitation link has expired.'); end if;

  v_role := case when upper(replace(coalesce(v_inv.role, ''), '-', '_')) = 'FACULTY_COORDINATOR' then 'FACULTY_COORDINATOR' else 'DEPARTMENT_COORDINATOR' end;
  select public.ensure_user_profile(
    p_user_id, p_user_email, coalesce(nullif(p_user_name, ''), 'Coordinator'), v_role,
    true, true, null, 'PENDING', null, null,
    v_inv."institutionId", v_inv."facultyId", v_inv."departmentId", null, null,
    null, null, null, null
  ) into v_user_id;

  update "CoordinatorInvitation"
  set status = 'ACTIVATED', "activatedAt" = now(), "activatedById" = p_user_id, "updatedAt" = now()
  where id = v_inv.id;

  return jsonb_build_object('success', true, 'message', 'Invitation activated.', 'userId', p_user_id, 'email', p_user_email);
end;
$$;

grant execute on function public.activate_coordinator_invitation(text, text, text, text) to anon, authenticated;
