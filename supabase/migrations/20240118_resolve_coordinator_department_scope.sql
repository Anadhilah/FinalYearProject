-- Resolve free-text coordinator registrations against existing reference data.
-- Apply after 20240117_faculty_invitation_permissions.sql.

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

    v_department_id := nullif(trim(v_request."departmentId"), '');
    v_institution_id := nullif(trim(v_request."institutionId"), '');
    v_faculty_id := nullif(trim(v_request."facultyId"), '');

    if v_department_id is null and nullif(trim(v_request."departmentName"), '') is not null then
      select d.id, d."institutionId", d."facultyId"
      into v_department_id, v_institution_id, v_faculty_id
      from "Department" d
      left join "Institution" i on i.id = d."institutionId"
      left join "FacultySchool" f on f.id = d."facultyId"
      where lower(trim(d.name)) = lower(trim(v_request."departmentName"))
        and (
          v_institution_id is not null and d."institutionId" = v_institution_id
          or v_institution_id is null and (
            nullif(trim(v_request."institutionName"), '') is null
            or lower(trim(i.name)) = lower(trim(v_request."institutionName"))
          )
        )
        and (
          v_faculty_id is not null and d."facultyId" = v_faculty_id
          or v_faculty_id is null and (
            nullif(trim(v_request."facultyName"), '') is null
            or lower(trim(f.name)) = lower(trim(v_request."facultyName"))
          )
        )
      order by d.id
      limit 1;
    end if;

    if v_department_id is null then
      return jsonb_build_object(
        'success', false,
        'message', format(
          'No Department record matched "%s" for institution "%s". Add that department to the Department table, then retry.',
          coalesce(v_request."departmentName", ''),
          coalesce(v_request."institutionName", '')
        )
      );
    end if;

    update "DepartmentCoordinatorRequest"
    set "institutionId" = coalesce("institutionId", v_institution_id),
        "facultyId" = coalesce("facultyId", v_faculty_id),
        "departmentId" = v_department_id,
        "updatedAt" = now()
    where id = v_request.id;

    update "User"
    set "institutionId" = coalesce(v_user."institutionId", v_institution_id),
        "facultyId" = coalesce(v_user."facultyId", v_faculty_id),
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
