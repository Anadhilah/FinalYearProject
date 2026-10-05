-- Recruiters can create and read company supervisor accounts for their company.

alter table "User"
  add column if not exists "companyRecruiterId" text references "User" (id) on delete set null;

create index if not exists "User_companyRecruiterId_idx"
  on "User" ("companyRecruiterId");

grant select on table "User" to authenticated;

drop policy if exists "Recruiters read company supervisors" on "User";
create policy "Recruiters read company supervisors" on "User"
  for select to authenticated
  using (
    public.get_my_role() = 'RECRUITER'
    and role = 'SUPERVISOR'::"Role"
    and coalesce(suspended, false) = false
    and (
      "companyRecruiterId" = auth.uid()::text
      or exists (
        select 1 from "Internship" internship
        where internship."supervisorId" = "User".id
          and internship."recruiterId" = auth.uid()::text
      )
    )
  );