-- Enforce the department-first application workflow at the database boundary.

-- Affiliated students must create applications in the department review queue.
drop policy if exists "Students create applications" on "Application";
create policy "Students create applications" on "Application"
  for insert to authenticated
  with check (
    "studentId" = auth.uid()::text
    and (
      (
        exists (
          select 1
          from "StudentInstitutionAffiliation" affiliation
          where affiliation."studentId" = auth.uid()::text
            and affiliation."isPrimary" = true
        )
        and "departmentApprovalRequired" = true
        and "departmentReviewStatus" = 'PENDING'::"DepartmentReviewStatus"
      )
      or (
        not exists (
          select 1
          from "StudentInstitutionAffiliation" affiliation
          where affiliation."studentId" = auth.uid()::text
            and affiliation."isPrimary" = true
        )
        and "departmentApprovalRequired" = false
        and "departmentReviewStatus" = 'NOT_REQUIRED'::"DepartmentReviewStatus"
      )
    )
  );

-- Recruiters can only read and update applications cleared by the department.
drop policy if exists "Recruiters read applications for own internships" on "Application";
drop policy if exists "Recruiters read approved applications for own internships" on "Application";
create policy "Recruiters read approved applications for own internships" on "Application"
  for select to authenticated
  using (
    and "departmentReviewStatus" in ('NOT_REQUIRED', 'APPROVED')
    and exists (
      select 1
      from "Internship" internship
      where internship.id = "Application"."internshipId"
        and internship."recruiterId" = auth.uid()::text
    )
  );

drop policy if exists "Recruiters update own internship applications" on "Application";
drop policy if exists "Recruiters update approved internship applications" on "Application";
create policy "Recruiters update approved internship applications" on "Application"
  for update to authenticated
  using (
    and "departmentReviewStatus" in ('NOT_REQUIRED', 'APPROVED')
    and exists (
      select 1
      from "Internship" internship
      where internship.id = "Application"."internshipId"
        and internship."recruiterId" = auth.uid()::text
    )
  )
  with check (
    and "departmentReviewStatus" in ('NOT_REQUIRED', 'APPROVED')
    and exists (
      select 1
      from "Internship" internship
      where internship.id = "Application"."internshipId"
        and internship."recruiterId" = auth.uid()::text
    )
  );

-- An explicitly selected coordinator is authorised for that application. An
-- unassigned application still requires the coordinator's stored scope.
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

  select * into v_row
  from "Application"
  where id = p_application_id
  limit 1;

  if v_row.id is null then
    return jsonb_build_object('success', false, 'message', 'Application not found.');
  end if;

  if auth.uid() is null or public.get_my_role() <> 'DEPARTMENT_COORDINATOR' then
    return jsonb_build_object('success', false, 'message', 'Only a Department Coordinator can review this application.');
  end if;

  if v_row."departmentCoordinatorId" is not null
     and v_row."departmentCoordinatorId" <> auth.uid()::text then
    return jsonb_build_object('success', false, 'message', 'This application was assigned to another department coordinator.');
  end if;

  if v_row."departmentReviewStatus" <> 'PENDING' then
    return jsonb_build_object('success', false, 'message', 'This application is not awaiting department review.');
  end if;

  select * into v_affiliation
  from "StudentInstitutionAffiliation"
  where "studentId" = v_row."studentId"
    and "isPrimary" = true
  limit 1;

  if v_row."departmentCoordinatorId" is null
     and (
       v_affiliation.id is null
       or not public.can_read_student_affiliation(
         v_affiliation."institutionId",
         v_affiliation."facultyId",
         v_affiliation."departmentId",
         v_row."studentId"
       )
     ) then
    return jsonb_build_object('success', false, 'message', 'This application is outside your department scope.');
  end if;

  if v_decision = 'APPROVED' then
    update "Application"
    set "departmentReviewStatus" = 'APPROVED'::"DepartmentReviewStatus",
        "departmentApprovalRequired" = false,
        "updatedAt" = now()
    where id = p_application_id;
    return jsonb_build_object('success', true, 'message', 'Application approved.');
  elsif v_decision = 'REJECTED' then
    update "Application"
    set "departmentReviewStatus" = 'REJECTED'::"DepartmentReviewStatus",
        "updatedAt" = now()
    where id = p_application_id;
    return jsonb_build_object('success', true, 'message', 'Application rejected.');
  end if;

  return jsonb_build_object('success', false, 'message', 'Unknown review decision.');
end;
$$;

grant execute on function public.review_department_application(text, text) to authenticated;
