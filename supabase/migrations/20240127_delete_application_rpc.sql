-- Delete applications through explicit role and ownership checks.

create or replace function public.delete_application(p_application_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_application "Application"%rowtype;
  v_role text;
  v_allowed boolean := false;
begin
  if auth.uid() is null then
    return jsonb_build_object('success', false, 'message', 'You must be signed in.');
  end if;

  select * into v_application
  from "Application"
  where id = p_application_id;

  if v_application.id is null then
    return jsonb_build_object('success', false, 'message', 'Application not found.');
  end if;

  v_role := public.get_my_role();

  if v_role = 'RECRUITER' then
    select exists (
      select 1
      from "Internship" internship
      where internship.id = v_application."internshipId"
        and internship."recruiterId" = auth.uid()::text
        and v_application."departmentReviewStatus" in ('NOT_REQUIRED', 'APPROVED')
    ) into v_allowed;
  elsif v_role = 'DEPARTMENT_COORDINATOR' then
    v_allowed := v_application."departmentReviewStatus" = 'PENDING'
      and (
        v_application."departmentCoordinatorId" = auth.uid()::text
        or (
          v_application."departmentCoordinatorId" is null
          and exists (
            select 1
            from "StudentInstitutionAffiliation" affiliation
            where affiliation."studentId" = v_application."studentId"
              and affiliation."isPrimary" = true
              and public.can_read_student_affiliation(
                affiliation."institutionId",
                affiliation."facultyId",
                affiliation."departmentId",
                v_application."studentId"
              )
        )
      );
  end if;

  if not v_allowed then
    return jsonb_build_object('success', false, 'message', 'You are not authorized to delete this application.');
  end if;

  delete from "Application" where id = p_application_id;
  return jsonb_build_object('success', true, 'message', 'Application deleted.');
end;
$$;

grant execute on function public.delete_application(text) to authenticated;