-- Coordinator access to student affiliations and scoped coordinator assignments.
-- Apply this migration before loading coordinator dashboards that read these tables.

alter table "CoordinatorAssignment"
  add column if not exists role text,
  add column if not exists status text not null default 'PENDING',
  add column if not exists "institutionId" text references "Institution" (id) on delete set null,
  add column if not exists "facultyId" text references "FacultySchool" (id) on delete set null,
  add column if not exists "departmentId" text references "Department" (id) on delete set null,
  add column if not exists "assignedById" text references "User" (id) on delete set null,
  add column if not exists "createdAt" timestamptz not null default now(),
  add column if not exists "updatedAt" timestamptz not null default now();

-- The helper runs with the owner's privileges so the policy can safely inspect
-- the caller's profile and assignments without recursive RLS failures.
create or replace function public.can_read_student_affiliation(
  p_institution_id text,
  p_faculty_id text,
  p_department_id text,
  p_student_id text
) returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  if auth.uid() is null then
    return false;
  end if;

  if auth.uid()::text = p_student_id then
    return true;
  end if;

  select role::text into v_role
  from "User"
  where id = auth.uid()::text;

  if v_role = 'ADMIN' then
    return true;
  end if;

  if v_role = 'DEPARTMENT_COORDINATOR' then
    return exists (
      select 1
      from "User" coordinator
      where coordinator.id = auth.uid()::text
        and (
          (coordinator."institutionId" is not null and coordinator."institutionId" = p_institution_id)
          or (coordinator."facultyId" is not null and coordinator."facultyId" = p_faculty_id)
          or (coordinator."departmentId" is not null and coordinator."departmentId" = p_department_id)
        )
    );
  end if;

  if v_role = 'FACULTY_COORDINATOR' then
    return exists (
      select 1
      from "CoordinatorAssignment" assignment
      where assignment."coordinatorId" = auth.uid()::text
        and upper(coalesce(assignment.status, '')) = 'ACTIVE'
        and (
          (assignment."institutionId" is not null and assignment."institutionId" = p_institution_id)
          or (assignment."facultyId" is not null and assignment."facultyId" = p_faculty_id)
          or (assignment."departmentId" is not null and assignment."departmentId" = p_department_id)
        )
    );
  end if;

  return false;
end;
$$;

grant execute on function public.can_read_student_affiliation(text, text, text, text) to authenticated;

grant select on table "StudentInstitutionAffiliation" to authenticated;
grant select on table "CoordinatorAssignment" to authenticated;

drop policy if exists "Students read own institution affiliation" on "StudentInstitutionAffiliation";
create policy "Students read own institution affiliation" on "StudentInstitutionAffiliation"
  for select to authenticated
  using ("studentId" = auth.uid()::text);

drop policy if exists "Coordinators read scoped institution affiliations" on "StudentInstitutionAffiliation";
create policy "Coordinators read scoped institution affiliations" on "StudentInstitutionAffiliation"
  for select to authenticated
  using (
    public.can_read_student_affiliation("institutionId", "facultyId", "departmentId", "studentId")
  );

drop policy if exists "Admins manage institution affiliations" on "StudentInstitutionAffiliation";
create policy "Admins manage institution affiliations" on "StudentInstitutionAffiliation"
  for all to authenticated
  using (public.get_my_role() = 'ADMIN')
  with check (public.get_my_role() = 'ADMIN');

drop policy if exists "Coordinators read assigned coordinator records" on "CoordinatorAssignment";
create policy "Coordinators read assigned coordinator records" on "CoordinatorAssignment"
  for select to authenticated
  using (
    "coordinatorId" = auth.uid()::text
    or "assignedById" = auth.uid()::text
    or public.get_my_role() = 'ADMIN'
    or (
      public.get_my_role() = 'DEPARTMENT_COORDINATOR'
      and exists (
        select 1 from "User" coordinator
        where coordinator.id = auth.uid()::text
          and (
            (coordinator."institutionId" is not null and coordinator."institutionId" = "CoordinatorAssignment"."institutionId")
            or (coordinator."facultyId" is not null and coordinator."facultyId" = "CoordinatorAssignment"."facultyId")
            or (coordinator."departmentId" is not null and coordinator."departmentId" = "CoordinatorAssignment"."departmentId")
          )
      )
    )
  );

drop policy if exists "Admins manage coordinator assignments" on "CoordinatorAssignment";
create policy "Admins manage coordinator assignments" on "CoordinatorAssignment"
  for all to authenticated
  using (public.get_my_role() = 'ADMIN')
  with check (public.get_my_role() = 'ADMIN');
