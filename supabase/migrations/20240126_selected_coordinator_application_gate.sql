-- A student-selected department coordinator must approve the application
-- before the recruiter can see it, even without an affiliation record.

drop policy if exists "Students create applications" on "Application";
create policy "Students create applications" on "Application"
  for insert to authenticated
  with check (
    "studentId" = auth.uid()::text
    and (
      ("departmentCoordinatorId" is not null and "departmentApprovalRequired" = true and "departmentReviewStatus" = 'PENDING'::"DepartmentReviewStatus")
      or ("departmentCoordinatorId" is null and not exists (select 1 from "StudentInstitutionAffiliation" a where a."studentId" = auth.uid()::text and a."isPrimary" = true) and "departmentApprovalRequired" = false and "departmentReviewStatus" = 'NOT_REQUIRED'::"DepartmentReviewStatus")
    )
  );

drop policy if exists "Recruiters read approved applications for own internships" on "Application";
create policy "Recruiters read approved applications for own internships" on "Application"
  for select to authenticated
  using (
    "departmentReviewStatus" in ('NOT_REQUIRED', 'APPROVED')
    and exists (select 1 from "Internship" i where i.id = "Application"."internshipId" and i."recruiterId" = auth.uid()::text)
  );

drop policy if exists "Recruiters update approved internship applications" on "Application";
create policy "Recruiters update approved internship applications" on "Application"
  for update to authenticated
  using (
    "departmentReviewStatus" in ('NOT_REQUIRED', 'APPROVED')
    and exists (select 1 from "Internship" i where i.id = "Application"."internshipId" and i."recruiterId" = auth.uid()::text)
  )
  with check (
    "departmentReviewStatus" in ('NOT_REQUIRED', 'APPROVED')
    and exists (select 1 from "Internship" i where i.id = "Application"."internshipId" and i."recruiterId" = auth.uid()::text)
  );

create or replace function public.review_department_application(p_application_id text, p_decision text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_row "Application"%rowtype;
  v_affiliation "StudentInstitutionAffiliation"%rowtype;
  v_decision text := upper(coalesce(p_decision, ''));
begin
  select * into v_row from "Application" where id = p_application_id limit 1;
  if v_row.id is null then return jsonb_build_object('success', false, 'message', 'Application not found.'); end if;
  if auth.uid() is null or public.get_my_role() <> 'DEPARTMENT_COORDINATOR' then return jsonb_build_object('success', false, 'message', 'Only a Department Coordinator can review this application.'); end if;
  if v_row."departmentCoordinatorId" is not null and v_row."departmentCoordinatorId" <> auth.uid()::text then return jsonb_build_object('success', false, 'message', 'This application was assigned to another department coordinator.'); end if;
  if v_row."departmentReviewStatus" <> 'PENDING' then return jsonb_build_object('success', false, 'message', 'This application is not awaiting department review.'); end if;

  if v_row."departmentCoordinatorId" is null then
    select * into v_affiliation from "StudentInstitutionAffiliation" where "studentId" = v_row."studentId" and "isPrimary" = true limit 1;
    if v_affiliation.id is null or not public.can_read_student_affiliation(v_affiliation."institutionId", v_affiliation."facultyId", v_affiliation."departmentId", v_row."studentId") then
      return jsonb_build_object('success', false, 'message', 'This application is outside your department scope.');
    end if;
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

grant delete on table "Application" to authenticated;

drop policy if exists "Recruiters delete approved applications" on "Application";
create policy "Recruiters delete approved applications" on "Application"
  for delete to authenticated
  using (
    "departmentReviewStatus" in ('NOT_REQUIRED', 'APPROVED')
    and exists (
      select 1 from "Internship" internship
      where internship.id = "Application"."internshipId"
        and internship."recruiterId" = auth.uid()::text
    )
  );

drop policy if exists "Department coordinators delete assigned applications" on "Application";
create policy "Department coordinators delete assigned applications" on "Application"
  for delete to authenticated
  using (
    "departmentReviewStatus" = 'PENDING'
    and "departmentCoordinatorId" = auth.uid()::text
  );