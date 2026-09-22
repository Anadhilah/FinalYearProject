-- Allow department coordinators to create faculty coordinator invitations.
-- Run this if 20240115 was already applied but invitation inserts return 403.

grant select, insert on table "CoordinatorInvitation" to authenticated;

drop policy if exists "Department coordinators create faculty invitations" on "CoordinatorInvitation";
create policy "Department coordinators create faculty invitations" on "CoordinatorInvitation"
  for insert to authenticated
  with check (
    public.get_my_role() = 'DEPARTMENT_COORDINATOR'
    and "createdById" = auth.uid()::text
    and upper(replace(coalesce(role, ''), '-', '_')) = 'FACULTY_COORDINATOR'
    and "departmentId" is not null
  );

drop policy if exists "Department coordinators read own faculty invitations" on "CoordinatorInvitation";
create policy "Department coordinators read own faculty invitations" on "CoordinatorInvitation"
  for select to authenticated
  using (
    "createdById" = auth.uid()::text
    or public.get_my_role() = 'ADMIN'
  );

create or replace function public.create_faculty_coordinator_invitation(
  p_id text,
  p_email text,
  p_name text,
  p_token_hash text,
  p_token_expires_at timestamptz
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user "User"%rowtype;
  v_request "DepartmentCoordinatorRequest"%rowtype;
  v_department_id text;
  v_institution_id text;
  v_faculty_id text;
  v_invitation "CoordinatorInvitation"%rowtype;
begin
  select * into v_user from "User" where id = auth.uid()::text;
  if v_user.id is null or v_user.role <> 'DEPARTMENT_COORDINATOR'::"Role" then
    return jsonb_build_object('success', false, 'message', 'Only a Department Coordinator can create this invitation.');
  end if;
  if v_user."departmentId" is null then
    select * into v_request
    from "DepartmentCoordinatorRequest"
    where "userId" = auth.uid()::text
      and status in ('APPROVED', 'ACTIVE')
    order by "updatedAt" desc
    limit 1;

    if v_request.id is null then
      return jsonb_build_object('success', false, 'message', 'No approved department coordinator request was found for your account.');
    end if;

    v_department_id := v_request."departmentId";
    v_institution_id := v_request."institutionId";
    v_faculty_id := v_request."facultyId";

    if v_department_id is null and nullif(trim(v_request."departmentName"), '') is not null then
      select d.id, d."institutionId", d."facultyId"
      into v_department_id, v_institution_id, v_faculty_id
      from "Department" d
      left join "Institution" i on i.id = d."institutionId"
      where lower(trim(d.name)) = lower(trim(v_request."departmentName"))
        and (
          v_request."institutionId" is not null
          or v_request."institutionName" is null
          or lower(trim(i.name)) = lower(trim(v_request."institutionName"))
        )
      limit 1;
    end if;

    if v_department_id is null then
      return jsonb_build_object('success', false, 'message', 'Your approved department could not be matched to a Department record. Add the department to the Department table or update the request with its departmentId.');
    end if;

    update "User"
    set "institutionId" = coalesce(v_request."institutionId", v_institution_id),
        "facultyId" = coalesce(v_request."facultyId", v_faculty_id),
        "departmentId" = v_department_id,
        "updatedAt" = now()
    where id = auth.uid()::text;

    select * into v_user from "User" where id = auth.uid()::text;
  end if;

  insert into "CoordinatorInvitation" (
    id, email, name, role, "tokenHash", "tokenExpiresAt", status, "createdById",
    "institutionId", "facultyId", "departmentId", "createdAt", "updatedAt"
  ) values (
    p_id, trim(p_email), nullif(trim(p_name), ''), 'FACULTY_COORDINATOR', p_token_hash,
    p_token_expires_at, 'SENT', auth.uid()::text, v_user."institutionId", v_user."facultyId",
    v_user."departmentId", now(), now()
  ) returning * into v_invitation;

  return jsonb_build_object('success', true, 'invitation', to_jsonb(v_invitation));
end;
$$;

grant execute on function public.create_faculty_coordinator_invitation(text, text, text, text, timestamptz) to authenticated;
