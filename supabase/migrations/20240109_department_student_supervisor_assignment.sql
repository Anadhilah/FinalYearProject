-- Department coordinators can view supervisors and assign them to scoped student internships.

grant select on table "User" to authenticated;
grant update on table "Internship" to authenticated;

drop policy if exists "Department coordinators read scoped student applications" on "Application";
create policy "Department coordinators read scoped student applications" on "Application"
  for select to authenticated
  using (
    public.get_my_role() = 'DEPARTMENT_COORDINATOR'
    and exists (
      select 1
      from "StudentInstitutionAffiliation" affiliation
      where affiliation."studentId" = "Application"."studentId"
        and affiliation."isPrimary" = true
        and public.can_read_student_affiliation(
          affiliation."institutionId",
          affiliation."facultyId",
          affiliation."departmentId",
          affiliation."studentId"
        )
    )
  );

drop policy if exists "Coordinators read supervisors" on "User";
create policy "Coordinators read supervisors" on "User"
  for select to authenticated
  using (
    role = 'SUPERVISOR'::"Role"
    and public.get_my_role() = 'DEPARTMENT_COORDINATOR'
  );

drop policy if exists "Department coordinators assign scoped supervisors" on "Internship";
create policy "Department coordinators assign scoped supervisors" on "Internship"
  for update to authenticated
  using (
    public.get_my_role() = 'DEPARTMENT_COORDINATOR'
    and exists (
      select 1
      from "Application" application
      join "StudentInstitutionAffiliation" affiliation
        on affiliation."studentId" = application."studentId"
       and affiliation."isPrimary" = true
      where application."internshipId" = "Internship".id
        and public.can_read_student_affiliation(
          affiliation."institutionId",
          affiliation."facultyId",
          affiliation."departmentId",
          affiliation."studentId"
        )
    )
  )
  with check (
    public.get_my_role() = 'DEPARTMENT_COORDINATOR'
    and (
      "supervisorId" is null
      or exists (
        select 1 from "User" supervisor
        where supervisor.id = "Internship"."supervisorId"
          and supervisor.role = 'SUPERVISOR'::"Role"
      )
    )
  );
