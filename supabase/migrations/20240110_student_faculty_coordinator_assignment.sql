-- Assign faculty coordinators directly to department students.
-- Existing scope assignments remain supported; studentId identifies individual support assignments.

alter table "CoordinatorAssignment"
  add column if not exists "studentId" text references "User" (id) on delete cascade,
  add column if not exists "coordinatorId" text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'CoordinatorAssignment_coordinatorId_fkey'
      and conrelid = '"CoordinatorAssignment"'::regclass
  ) then
    alter table "CoordinatorAssignment"
      add constraint "CoordinatorAssignment_coordinatorId_fkey"
      foreign key ("coordinatorId") references "User" (id) on delete cascade;
  end if;
end $$;

grant select, insert, update, delete on table "CoordinatorAssignment" to authenticated;

drop policy if exists "Department coordinators manage student faculty assignments" on "CoordinatorAssignment";
create policy "Department coordinators manage student faculty assignments" on "CoordinatorAssignment"
  for all to authenticated
  using (
    public.get_my_role() = 'DEPARTMENT_COORDINATOR'
    and "studentId" is not null
    and exists (
      select 1
      from "StudentInstitutionAffiliation" affiliation
      where affiliation."studentId" = "CoordinatorAssignment"."studentId"
        and affiliation."isPrimary" = true
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
    and "studentId" is not null
    and role = 'Faculty Coordinator'
    and exists (
      select 1
      from "User" coordinator
      where coordinator.id = "CoordinatorAssignment"."coordinatorId"
        and coordinator.role = 'FACULTY_COORDINATOR'::"Role"
    )
    and exists (
      select 1
      from "StudentInstitutionAffiliation" affiliation
      where affiliation."studentId" = "CoordinatorAssignment"."studentId"
        and affiliation."isPrimary" = true
        and public.can_read_student_affiliation(
          affiliation."institutionId",
          affiliation."facultyId",
          affiliation."departmentId",
          affiliation."studentId"
        )
    )
  );
