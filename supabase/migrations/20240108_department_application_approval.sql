-- Department approval for applications from students affiliated with platform institutions.
-- Students without a StudentInstitutionAffiliation continue directly to recruiters.

alter table "Application"
  add column if not exists "departmentApprovalRequired" boolean not null default false;

grant select on table "Application" to authenticated;
grant update on table "Application" to authenticated;

drop policy if exists "Coordinators read scoped student profiles" on "User";
create policy "Coordinators read scoped student profiles" on "User"
  for select to authenticated
  using (
    public.get_my_role() in ('DEPARTMENT_COORDINATOR', 'FACULTY_COORDINATOR')
    and exists (
      select 1
      from "StudentInstitutionAffiliation" affiliation
      where affiliation."studentId" = "User".id
        and affiliation."isPrimary" = true
        and public.can_read_student_affiliation(
          affiliation."institutionId",
          affiliation."facultyId",
          affiliation."departmentId",
          affiliation."studentId"
        )
    )
  );

drop policy if exists "Recruiters read applications for own internships" on "Application";
drop policy if exists "Recruiters read approved applications for own internships" on "Application";
create policy "Recruiters read approved applications for own internships" on "Application"
  for select to authenticated
  using (
    "departmentApprovalRequired" = false
    and exists (
      select 1 from "Internship" i
      where i.id = "Application"."internshipId"
        and i."recruiterId" = auth.uid()::text
    )
  );

drop policy if exists "Recruiters update own internship applications" on "Application";
drop policy if exists "Recruiters update approved internship applications" on "Application";
create policy "Recruiters update approved internship applications" on "Application"
  for update to authenticated
  using (
    "departmentApprovalRequired" = false
    and exists (
      select 1 from "Internship" i
      where i.id = "Application"."internshipId"
        and i."recruiterId" = auth.uid()::text
    )
  )
  with check (
    "departmentApprovalRequired" = false
    and exists (
      select 1 from "Internship" i
      where i.id = "Application"."internshipId"
        and i."recruiterId" = auth.uid()::text
    )
  );

drop policy if exists "Department coordinators read applications for review" on "Application";
drop policy if exists "Department coordinators read internship approvals" on "Application";
create policy "Department coordinators read internship approvals" on "Application"
  for select to authenticated
  using (
    "departmentApprovalRequired" = true
    and public.can_read_student_affiliation(
      (
        select affiliation."institutionId"
        from "StudentInstitutionAffiliation" affiliation
        where affiliation."studentId" = "Application"."studentId"
          and affiliation."isPrimary" = true
        limit 1
      ),
      (
        select affiliation."facultyId"
        from "StudentInstitutionAffiliation" affiliation
        where affiliation."studentId" = "Application"."studentId"
          and affiliation."isPrimary" = true
        limit 1
      ),
      (
        select affiliation."departmentId"
        from "StudentInstitutionAffiliation" affiliation
        where affiliation."studentId" = "Application"."studentId"
          and affiliation."isPrimary" = true
        limit 1
      ),
      "Application"."studentId"
    )
    and public.get_my_role() = 'DEPARTMENT_COORDINATOR'
  );

drop policy if exists "Department coordinators approve applications" on "Application";
drop policy if exists "Department coordinators review internship approvals" on "Application";
create policy "Department coordinators review internship approvals" on "Application"
  for update to authenticated
  using (
    "departmentApprovalRequired" = true
    and public.get_my_role() = 'DEPARTMENT_COORDINATOR'
    and public.can_read_student_affiliation(
      (
        select affiliation."institutionId"
        from "StudentInstitutionAffiliation" affiliation
        where affiliation."studentId" = "Application"."studentId"
          and affiliation."isPrimary" = true
        limit 1
      ),
      (
        select affiliation."facultyId"
        from "StudentInstitutionAffiliation" affiliation
        where affiliation."studentId" = "Application"."studentId"
          and affiliation."isPrimary" = true
        limit 1
      ),
      (
        select affiliation."departmentId"
        from "StudentInstitutionAffiliation" affiliation
        where affiliation."studentId" = "Application"."studentId"
          and affiliation."isPrimary" = true
        limit 1
      ),
      "Application"."studentId"
    )
  )
  with check (
    "departmentApprovalRequired" = false
  );
