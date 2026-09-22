-- Allow faculty coordinators to receive supervisor-approved reports and forward them.
-- Department coordinators can read reports after faculty forwarding.

do $$
begin
  if exists (select 1 from pg_type where typname = 'LogbookReportStatus') then
    alter type "LogbookReportStatus" add value if not exists 'PENDING_SUPERVISOR_REVIEW';
    alter type "LogbookReportStatus" add value if not exists 'SUPERVISOR_APPROVED';
    alter type "LogbookReportStatus" add value if not exists 'APPROVED';
    alter type "LogbookReportStatus" add value if not exists 'COMPLETED';
  elsif exists (select 1 from pg_type where typname = 'LogbookStatus') then
    alter type "LogbookStatus" add value if not exists 'PENDING_SUPERVISOR_REVIEW';
    alter type "LogbookStatus" add value if not exists 'SUPERVISOR_APPROVED';
    alter type "LogbookStatus" add value if not exists 'APPROVED';
    alter type "LogbookStatus" add value if not exists 'COMPLETED';
  else
    raise exception 'Neither LogbookReportStatus nor LogbookStatus exists';
  end if;
end $$;

grant select, update on table "WeeklyLogbookReport" to authenticated;

drop policy if exists "Faculty coordinators read scoped logbook reports" on "WeeklyLogbookReport";
create policy "Faculty coordinators read scoped logbook reports" on "WeeklyLogbookReport"
  for select to authenticated
  using (
    public.get_my_role() = 'FACULTY_COORDINATOR'
    and "status"::text in ('SUPERVISOR_APPROVED', 'APPROVED')
    and exists (
      select 1
      from "StudentInstitutionAffiliation" affiliation
      where affiliation."studentId" = "WeeklyLogbookReport"."studentId"
        and (
          public.can_read_student_affiliation(
            affiliation."institutionId",
            affiliation."facultyId",
            affiliation."departmentId",
            affiliation."studentId"
          )
          or exists (
            select 1
            from "CoordinatorAssignment" assignment
            where assignment."coordinatorId" = auth.uid()::text
              and assignment."studentId" = "WeeklyLogbookReport"."studentId"
              and upper(coalesce(assignment.status, '')) = 'ACTIVE'
          )
        )
    )
  );

drop policy if exists "Faculty coordinators update scoped logbook reports" on "WeeklyLogbookReport";
create policy "Faculty coordinators update scoped logbook reports" on "WeeklyLogbookReport"
  for update to authenticated
  using (
    public.get_my_role() = 'FACULTY_COORDINATOR'
    and "status"::text in ('SUPERVISOR_APPROVED', 'APPROVED')
    and exists (
      select 1
      from "StudentInstitutionAffiliation" affiliation
      where affiliation."studentId" = "WeeklyLogbookReport"."studentId"
        and (
          public.can_read_student_affiliation(
            affiliation."institutionId",
            affiliation."facultyId",
            affiliation."departmentId",
            affiliation."studentId"
          )
          or exists (
            select 1
            from "CoordinatorAssignment" assignment
            where assignment."coordinatorId" = auth.uid()::text
              and assignment."studentId" = "WeeklyLogbookReport"."studentId"
              and upper(coalesce(assignment.status, '')) = 'ACTIVE'
          )
        )
    )
  );

drop policy if exists "Department coordinators read forwarded logbook reports" on "WeeklyLogbookReport";
create policy "Department coordinators read forwarded logbook reports" on "WeeklyLogbookReport"
  for select to authenticated
  using (
    public.get_my_role() = 'DEPARTMENT_COORDINATOR'
    and "status"::text = 'COMPLETED'
    and exists (
      select 1
      from "StudentInstitutionAffiliation" affiliation
      where affiliation."studentId" = "WeeklyLogbookReport"."studentId"
        and public.can_read_student_affiliation(
          affiliation."institutionId",
          affiliation."facultyId",
          affiliation."departmentId",
          affiliation."studentId"
        )
    )
  );
