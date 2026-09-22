-- Route support requests to the coordinator selected by the student.

alter table "Application"
  add column if not exists "departmentCoordinatorId" text references "User" (id) on delete set null;

grant select on table "User" to authenticated;

drop policy if exists "Students read available department coordinators" on "User";
create policy "Students read available department coordinators" on "User"
  for select to authenticated
  using (
    role = 'DEPARTMENT_COORDINATOR'::"Role"
    and "coordinatorStatus" in ('APPROVED', 'ACTIVE')
  );

drop policy if exists "Department coordinators read internship approvals" on "Application";
create policy "Department coordinators read internship approvals" on "Application"
  for select to authenticated
  using (
    "departmentApprovalRequired" = true
    and (
      "departmentCoordinatorId" = auth.uid()::text
      or ("departmentCoordinatorId" is null and public.can_read_student_affiliation(
        (select affiliation."institutionId" from "StudentInstitutionAffiliation" affiliation where affiliation."studentId" = "Application"."studentId" and affiliation."isPrimary" = true limit 1),
        (select affiliation."facultyId" from "StudentInstitutionAffiliation" affiliation where affiliation."studentId" = "Application"."studentId" and affiliation."isPrimary" = true limit 1),
        (select affiliation."departmentId" from "StudentInstitutionAffiliation" affiliation where affiliation."studentId" = "Application"."studentId" and affiliation."isPrimary" = true limit 1),
        "Application"."studentId"
      ))
    )
  );

create or replace function public.review_department_application(
  p_application_id text,
  p_decision text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row "Application"%rowtype;
  v_affiliation "StudentInstitutionAffiliation"%rowtype;
  v_decision text;
begin
  v_decision := upper(coalesce(p_decision, ''));
  select * into v_row from "Application" where id = p_application_id limit 1;
  if v_row.id is null then return jsonb_build_object('success', false, 'message', 'Application not found.'); end if;
  if auth.uid() is null or public.get_my_role() <> 'DEPARTMENT_COORDINATOR' then
    return jsonb_build_object('success', false, 'message', 'Only a Department Coordinator can review this application.');
  end if;
  if v_row."departmentCoordinatorId" is not null and v_row."departmentCoordinatorId" <> auth.uid()::text then
    return jsonb_build_object('success', false, 'message', 'This application was assigned to another department coordinator.');
  end if;
  if v_row."departmentReviewStatus" <> 'PENDING' or v_row."coordinatorSupportRequested" <> true then
    return jsonb_build_object('success', false, 'message', 'This application is not awaiting department review.');
  end if;
  select * into v_affiliation from "StudentInstitutionAffiliation" where "studentId" = v_row."studentId" and "isPrimary" = true limit 1;
  if v_affiliation.id is null or not public.can_read_student_affiliation(v_affiliation."institutionId", v_affiliation."facultyId", v_affiliation."departmentId", v_row."studentId") then
    return jsonb_build_object('success', false, 'message', 'This application is outside your department scope.');
  end if;
  if v_decision = 'APPROVED' then
    update "Application" set "departmentReviewStatus" = 'APPROVED'::"DepartmentReviewStatus", "departmentApprovalRequired" = false, "updatedAt" = now() where id = p_application_id;
    return jsonb_build_object('success', true, 'message', 'Application approved.');
  elsif v_decision = 'REJECTED' then
    update "Application" set "departmentReviewStatus" = 'REJECTED'::"DepartmentReviewStatus", "updatedAt" = now() where id = p_application_id;
    return jsonb_build_object('success', true, 'message', 'Application rejected.');
  end if;
  return jsonb_build_object('success', false, 'message', 'Unknown review decision.');
end;
$$;

grant execute on function public.review_department_application(text, text) to authenticated;