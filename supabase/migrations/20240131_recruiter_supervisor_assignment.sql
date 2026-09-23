-- Allow recruiters to assign company supervisors to their own internships.

grant select on table "User" to authenticated;
grant update on table "Internship" to authenticated;

drop policy if exists "Recruiters read company supervisors" on "User";
create policy "Recruiters read company supervisors" on "User"
  for select to authenticated
  using (
    public.get_my_role() = 'RECRUITER'
    and role = 'SUPERVISOR'::"Role"
    and coalesce(suspended, false) = false
  );

drop policy if exists "Recruiters assign supervisors to own internships" on "Internship";
create policy "Recruiters assign supervisors to own internships" on "Internship"
  for update to authenticated
  using (
    public.get_my_role() = 'RECRUITER'
    and "recruiterId" = auth.uid()::text
  )
  with check (
    public.get_my_role() = 'RECRUITER'
    and "recruiterId" = auth.uid()::text
    and (
      "supervisorId" is null
      or exists (
        select 1 from "User" supervisor
        where supervisor.id = "Internship"."supervisorId"
          and supervisor.role = 'SUPERVISOR'::"Role"
          and coalesce(supervisor.suspended, false) = false
      )
    )
  );