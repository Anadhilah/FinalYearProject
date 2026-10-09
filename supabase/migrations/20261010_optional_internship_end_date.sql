alter table "InternshipCompletionWorkflow"
  alter column "initialEndDate" drop not null,
  alter column "currentEndDate" drop not null;

create or replace function public.refresh_internship_completion_workflows()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'You must be signed in.';
  end if;

  insert into "InternshipCompletionWorkflow" (
    id, "applicationId", "internshipId", "studentId", "companySupervisorId",
    "facultyCoordinatorId", "departmentCoordinatorId", "studentName", "internshipTitle",
    "companyName", "companySupervisorName", "facultyCoordinatorName",
    "departmentCoordinatorName", "initialEndDate", "currentEndDate", status,
    "endNoticeAt", "createdAt", "updatedAt"
  )
  select
    gen_random_uuid()::text,
    application.id,
    internship.id,
    application."studentId",
    internship."supervisorId",
    faculty_assignment."coordinatorId",
    coalesce(application."departmentCoordinatorId", department_assignment.id),
    coalesce(student.name, student.email, 'Student'),
    internship.title,
    coalesce(recruiter.company, recruiter.name, 'Company'),
    company_supervisor.name,
    faculty_coordinator.name,
    department_coordinator.name,
    internship."endDate",
    internship."endDate",
    case when internship."endDate" is not null and internship."endDate" <= current_date then 'END_DATE_REACHED' else 'ACTIVE' end,
    case when internship."endDate" is not null and internship."endDate" <= current_date then now() else null end,
    now(),
    now()
  from "Application" application
  join "Internship" internship on internship.id = application."internshipId"
  join "User" student on student.id = application."studentId"
  join "User" recruiter on recruiter.id = internship."recruiterId"
  left join "User" company_supervisor on company_supervisor.id = internship."supervisorId"
  left join lateral (
    select coordinator.id, coordinator.name
    from "StudentInstitutionAffiliation" affiliation
    join "User" coordinator on coordinator."departmentId" = affiliation."departmentId"
    where affiliation."studentId" = application."studentId"
      and affiliation."isPrimary" = true
      and coordinator.role = 'DEPARTMENT_COORDINATOR'::"Role"
    order by coordinator."createdAt" desc
    limit 1
  ) department_assignment on true
  left join "User" department_coordinator
    on department_coordinator.id = coalesce(application."departmentCoordinatorId", department_assignment.id)
  left join lateral (
    select assignment."coordinatorId"
    from "CoordinatorAssignment" assignment
    where assignment."studentId" = application."studentId"
      and assignment.role = 'Faculty Coordinator'
      and upper(coalesce(assignment.status, '')) = 'ACTIVE'
    order by assignment."createdAt" desc
    limit 1
  ) faculty_assignment on true
  left join "User" faculty_coordinator on faculty_coordinator.id = faculty_assignment."coordinatorId"
  where application.status::text in ('ACCEPTED', 'OFFER_ACCEPTED')
    and internship."supervisorId" is not null
  on conflict ("applicationId") do nothing;

  update "InternshipCompletionWorkflow"
  set status = 'END_DATE_REACHED',
      "endNoticeAt" = coalesce("endNoticeAt", now()),
      "updatedAt" = now()
  where status = 'ACTIVE'
    and "currentEndDate" is not null
    and "currentEndDate" <= current_date;
end;
$$;

revoke all on function public.refresh_internship_completion_workflows() from public;
grant execute on function public.refresh_internship_completion_workflows() to authenticated;

create or replace function public.end_internship_early(
  p_workflow_id text,
  p_reason text
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_workflow "InternshipCompletionWorkflow"%rowtype;
  v_reason text := nullif(trim(coalesce(p_reason, '')), '');
begin
  if auth.uid() is null or public.get_my_role() is distinct from 'SUPERVISOR' then
    raise exception 'Only a company supervisor can end an internship early.';
  end if;

  if v_reason is null then
    raise exception 'A reason is required to end an internship early.';
  end if;

  if length(v_reason) > 2000 then
    raise exception 'The early-end reason must be 2000 characters or fewer.';
  end if;

  select * into v_workflow
  from "InternshipCompletionWorkflow"
  where id = p_workflow_id
  for update;

  if not found or v_workflow."companySupervisorId" <> auth.uid()::text then
    raise exception 'Internship completion record not found.';
  end if;

  if v_workflow.status <> 'ACTIVE'
     or (v_workflow."currentEndDate" is not null and v_workflow."currentEndDate" <= current_date) then
    raise exception 'Early ending is available only while the internship is active.';
  end if;

  update "InternshipCompletionWorkflow"
  set status = 'REPORT_DUE',
      "earlyEndReason" = v_reason,
      "earlyEndedAt" = now(),
      "updatedAt" = now()
  where id = v_workflow.id;
end;
$$;

revoke all on function public.end_internship_early(text, text) from public;
grant execute on function public.end_internship_early(text, text) to authenticated;