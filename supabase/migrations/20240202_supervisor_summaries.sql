-- Period-based supervisor summaries sent to the assigned faculty coordinator.

create table if not exists "SupervisorSummary" (
  id text primary key,
  "studentId" text not null references "User" (id) on delete cascade,
  "supervisorId" text not null references "User" (id) on delete cascade,
  "facultyCoordinatorId" text not null references "User" (id) on delete cascade,
  "internshipId" text not null references "Internship" (id) on delete cascade,
  "periodStart" date not null,
  "periodEnd" date not null,
  title text not null,
  summary text not null,
  "facultyFeedback" text,
  "facultyFeedbackAt" timestamptz,
  status text not null default 'SENT',
  "createdAt" timestamptz not null default now()
);
alter table "SupervisorSummary" enable row level security;
alter table "SupervisorSummary"
  add column if not exists "facultyFeedback" text,
  add column if not exists "facultyFeedbackAt" timestamptz;
grant select, insert, update on table "SupervisorSummary" to authenticated;

drop policy if exists "Supervisors read faculty assignments for interns" on "CoordinatorAssignment";
create policy "Supervisors read faculty assignments for interns" on "CoordinatorAssignment"
  for select to authenticated
  using (
    public.get_my_role() = 'SUPERVISOR'
    and exists (
      select 1 from "Application" application
      join "Internship" internship on internship.id = application."internshipId"
      where application."studentId" = "CoordinatorAssignment"."studentId"
        and internship."supervisorId" = auth.uid()::text
    )
  );

drop policy if exists "Supervisors send summaries for assigned students" on "SupervisorSummary";
create policy "Supervisors send summaries for assigned students" on "SupervisorSummary"
  for insert to authenticated
  with check (
    "supervisorId" = auth.uid()::text
    and public.get_my_role() = 'SUPERVISOR'
    and exists (select 1 from "Internship" i where i.id = "SupervisorSummary"."internshipId" and i."supervisorId" = auth.uid()::text)
    and exists (select 1 from "CoordinatorAssignment" assignment where assignment."studentId" = "SupervisorSummary"."studentId" and assignment."coordinatorId" = "SupervisorSummary"."facultyCoordinatorId" and assignment.role = 'Faculty Coordinator' and upper(coalesce(assignment.status, '')) = 'ACTIVE')
  );

drop policy if exists "Supervisors read own summaries" on "SupervisorSummary";
create policy "Supervisors read own summaries" on "SupervisorSummary"
  for select to authenticated using ("supervisorId" = auth.uid()::text);

drop policy if exists "Faculty coordinators read assigned summaries" on "SupervisorSummary";
create policy "Faculty coordinators read assigned summaries" on "SupervisorSummary"
  for select to authenticated using ("facultyCoordinatorId" = auth.uid()::text);

drop policy if exists "Faculty coordinators send summary feedback" on "SupervisorSummary";
create policy "Faculty coordinators send summary feedback" on "SupervisorSummary"
  for update to authenticated
  using ("facultyCoordinatorId" = auth.uid()::text)
  with check ("facultyCoordinatorId" = auth.uid()::text);

drop policy if exists "Department coordinators read student summaries" on "SupervisorSummary";
create policy "Department coordinators read student summaries" on "SupervisorSummary"
  for select to authenticated
  using (
    public.get_my_role() = 'DEPARTMENT_COORDINATOR'
    and exists (
      select 1 from "Application" application
      where application."studentId" = "SupervisorSummary"."studentId"
        and application."departmentCoordinatorId" = auth.uid()::text
    )
  );