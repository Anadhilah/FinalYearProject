-- Department coordinator student rosters are based on applications routed
-- directly to the signed-in coordinator, including students without affiliation.

grant select on table "User" to authenticated;

drop policy if exists "Department coordinators read routed students" on "User";
create policy "Department coordinators read routed students" on "User"
  for select to authenticated
  using (
    public.get_my_role() = 'DEPARTMENT_COORDINATOR'
    and exists (
      select 1 from "Application" application
      where application."studentId" = "User".id
        and application."departmentCoordinatorId" = auth.uid()::text
    )
  );

drop policy if exists "Department coordinators read faculty coordinators" on "User";
create policy "Department coordinators read faculty coordinators" on "User"
  for select to authenticated
  using (
    public.get_my_role() = 'DEPARTMENT_COORDINATOR'
    and role = 'FACULTY_COORDINATOR'::"Role"
  );

grant select, insert, update, delete on table "CoordinatorAssignment" to authenticated;

drop policy if exists "Department coordinators manage student faculty assignments" on "CoordinatorAssignment";
create policy "Department coordinators manage student faculty assignments" on "CoordinatorAssignment"
  for all to authenticated
  using (
    public.get_my_role() = 'DEPARTMENT_COORDINATOR'
    and "studentId" is not null
    and exists (
      select 1 from "Application" application
      where application."studentId" = "CoordinatorAssignment"."studentId"
        and application."departmentCoordinatorId" = auth.uid()::text
    )
  )
  with check (
    public.get_my_role() = 'DEPARTMENT_COORDINATOR'
    and "studentId" is not null
    and role = 'Faculty Coordinator'
    and exists (
      select 1 from "User" coordinator
      where coordinator.id = "CoordinatorAssignment"."coordinatorId"
        and coordinator.role = 'FACULTY_COORDINATOR'::"Role"
    )
    and exists (
      select 1 from "Application" application
      where application."studentId" = "CoordinatorAssignment"."studentId"
        and application."departmentCoordinatorId" = auth.uid()::text
    )
  );