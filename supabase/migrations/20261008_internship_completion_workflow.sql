create table if not exists "InternshipCompletionWorkflow" (
  id text primary key,
  "applicationId" text not null unique references "Application" (id) on delete cascade,
  "internshipId" text not null references "Internship" (id) on delete cascade,
  "studentId" text not null references "User" (id) on delete cascade,
  "companySupervisorId" text references "User" (id) on delete set null,
  "facultyCoordinatorId" text references "User" (id) on delete set null,
  "departmentCoordinatorId" text references "User" (id) on delete set null,
  "studentName" text not null,
  "internshipTitle" text not null,
  "companyName" text not null,
  "companySupervisorName" text,
  "facultyCoordinatorName" text,
  "departmentCoordinatorName" text,
  "initialEndDate" date not null,
  "currentEndDate" date not null,
  status text not null check (status in ('ACTIVE', 'END_DATE_REACHED', 'EXTENSION_REQUESTED', 'REPORT_DUE', 'REPORT_SUBMITTED', 'CLARIFICATION_REQUESTED', 'COMPLETED')),
  "endNoticeAt" timestamptz,
  "extensionEndDate" date,
  "extensionReason" text,
  "extensionRequestedAt" timestamptz,
  "extensionDecision" text check ("extensionDecision" in ('ACCEPTED', 'DECLINED')),
  "extensionRespondedAt" timestamptz,
  "reportSummary" text,
  "reportAssessment" text,
  "reportSubmittedAt" timestamptz,
  "studentAcknowledgedAt" timestamptz,
  "reviewDecision" text,
  "reviewComment" text,
  "reviewedAt" timestamptz,
  "completedAt" timestamptz,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

alter table "InternshipCompletionWorkflow" enable row level security;
grant select on table "InternshipCompletionWorkflow" to authenticated;

drop policy if exists "Placement participants read completion workflows" on "InternshipCompletionWorkflow";
create policy "Placement participants read completion workflows" on "InternshipCompletionWorkflow"
  for select to authenticated
  using (
    "studentId" = auth.uid()::text
    or "companySupervisorId" = auth.uid()::text
    or "facultyCoordinatorId" = auth.uid()::text
    or "departmentCoordinatorId" = auth.uid()::text
  );

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
    case when internship."endDate" <= current_date then 'END_DATE_REACHED' else 'ACTIVE' end,
    case when internship."endDate" <= current_date then now() else null end,
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
    and internship."endDate" is not null
  on conflict ("applicationId") do nothing;

  update "InternshipCompletionWorkflow"
  set status = 'END_DATE_REACHED',
      "endNoticeAt" = coalesce("endNoticeAt", now()),
      "updatedAt" = now()
  where status = 'ACTIVE'
    and "currentEndDate" <= current_date;
end;
$$;

revoke all on function public.refresh_internship_completion_workflows() from public;
grant execute on function public.refresh_internship_completion_workflows() to authenticated;

create or replace function public.transition_internship_completion_workflow(
  p_workflow_id text,
  p_action text,
  p_payload jsonb default '{}'::jsonb
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_workflow "InternshipCompletionWorkflow"%rowtype;
  v_role text;
  v_new_end_date date;
  v_reason text;
  v_summary text;
  v_assessment text;
  v_comment text;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in.';
  end if;

  select * into v_workflow
  from "InternshipCompletionWorkflow"
  where id = p_workflow_id
  for update;

  if not found then
    raise exception 'Internship completion record not found.';
  end if;

  v_role := public.get_my_role();
  v_comment := nullif(trim(coalesce(p_payload->>'comment', '')), '');

  if p_action in ('REQUEST_EXTENSION', 'END_INTERNSHIP', 'SUBMIT_FINAL_REPORT') then
    if v_role is distinct from 'SUPERVISOR' or v_workflow."companySupervisorId" <> auth.uid()::text then
      raise exception 'Only the assigned company supervisor can take this action.';
    end if;
  elsif p_action in ('ACCEPT_EXTENSION', 'DECLINE_EXTENSION', 'ACKNOWLEDGE_REPORT') then
    if v_role is distinct from 'STUDENT' or v_workflow."studentId" <> auth.uid()::text then
      raise exception 'Only the assigned student can take this action.';
    end if;
  elsif p_action in ('APPROVE_REPORT', 'REQUEST_CLARIFICATION', 'COMMENT_ON_REPORT') then
    if v_role is distinct from 'FACULTY_COORDINATOR' or v_workflow."facultyCoordinatorId" <> auth.uid()::text then
      raise exception 'Only the assigned Faculty Coordinator can review this report.';
    end if;
  else
    raise exception 'Unknown internship completion action.';
  end if;

  if p_action = 'REQUEST_EXTENSION' then
    v_new_end_date := nullif(p_payload->>'newEndDate', '')::date;
    v_reason := nullif(trim(coalesce(p_payload->>'reason', '')), '');
    if v_workflow.status <> 'END_DATE_REACHED' then
      raise exception 'This internship is not awaiting an end-date decision.';
    end if;
    if v_new_end_date is null or v_new_end_date <= v_workflow."currentEndDate" or v_new_end_date <= current_date then
      raise exception 'Choose an extension date later than the current end date and today.';
    end if;
    if v_reason is null then
      raise exception 'Enter a reason for the extension request.';
    end if;
    update "InternshipCompletionWorkflow"
    set status = 'EXTENSION_REQUESTED',
        "extensionEndDate" = v_new_end_date,
        "extensionReason" = v_reason,
        "extensionRequestedAt" = now(),
        "extensionDecision" = null,
        "extensionRespondedAt" = null,
        "updatedAt" = now()
    where id = v_workflow.id;
  elsif p_action = 'END_INTERNSHIP' then
    if v_workflow.status <> 'END_DATE_REACHED' then
      raise exception 'This internship is not awaiting an end-date decision.';
    end if;
    update "InternshipCompletionWorkflow"
    set status = 'REPORT_DUE', "updatedAt" = now()
    where id = v_workflow.id;
  elsif p_action in ('ACCEPT_EXTENSION', 'DECLINE_EXTENSION') then
    if v_workflow.status <> 'EXTENSION_REQUESTED' then
      raise exception 'This internship has no pending extension request.';
    end if;
    if p_action = 'ACCEPT_EXTENSION' then
      if v_workflow."extensionEndDate" <= current_date then
        raise exception 'The proposed extension date has passed. Ask the supervisor for a new date.';
      end if;
      update "InternshipCompletionWorkflow"
      set status = 'ACTIVE',
          "currentEndDate" = "extensionEndDate",
          "extensionDecision" = 'ACCEPTED',
          "extensionRespondedAt" = now(),
          "updatedAt" = now()
      where id = v_workflow.id;
    else
      update "InternshipCompletionWorkflow"
      set status = 'REPORT_DUE',
          "extensionDecision" = 'DECLINED',
          "extensionRespondedAt" = now(),
          "updatedAt" = now()
      where id = v_workflow.id;
    end if;
  elsif p_action = 'SUBMIT_FINAL_REPORT' then
    v_summary := nullif(trim(coalesce(p_payload->>'summary', '')), '');
    v_assessment := nullif(trim(coalesce(p_payload->>'assessment', '')), '');
    if v_workflow.status not in ('REPORT_DUE', 'CLARIFICATION_REQUESTED') then
      raise exception 'The final report is not currently due.';
    end if;
    if v_workflow."facultyCoordinatorId" is null then
      raise exception 'Assign a Faculty Coordinator before submitting the final report.';
    end if;
    if v_summary is null or v_assessment is null then
      raise exception 'Complete the report summary and supervisor assessment.';
    end if;
    update "InternshipCompletionWorkflow"
    set status = 'REPORT_SUBMITTED',
        "reportSummary" = v_summary,
        "reportAssessment" = v_assessment,
        "reportSubmittedAt" = now(),
        "studentAcknowledgedAt" = null,
        "reviewDecision" = 'PENDING',
        "updatedAt" = now()
    where id = v_workflow.id;
  elsif p_action = 'ACKNOWLEDGE_REPORT' then
    if v_workflow.status <> 'REPORT_SUBMITTED' then
      raise exception 'There is no submitted final report to acknowledge.';
    end if;
    update "InternshipCompletionWorkflow"
    set "studentAcknowledgedAt" = coalesce("studentAcknowledgedAt", now()),
        "updatedAt" = now()
    where id = v_workflow.id;
  elsif p_action in ('APPROVE_REPORT', 'REQUEST_CLARIFICATION', 'COMMENT_ON_REPORT') then
    if v_workflow.status <> 'REPORT_SUBMITTED' or v_workflow."studentAcknowledgedAt" is null then
      raise exception 'The student must acknowledge the report before university review.';
    end if;
    if p_action <> 'APPROVE_REPORT' and v_comment is null then
      raise exception 'Enter a comment for the report review.';
    end if;
    update "InternshipCompletionWorkflow"
    set "reviewDecision" = case
          when p_action = 'APPROVE_REPORT' then 'APPROVED'
          when p_action = 'REQUEST_CLARIFICATION' then 'CLARIFICATION_REQUESTED'
          else 'COMMENTED'
        end,
        "reviewComment" = case
          when v_comment is null then "reviewComment"
          when nullif("reviewComment", '') is null then v_comment
          else "reviewComment" || E'\n\n' || v_comment
        end,
        "reviewedAt" = now(),
        "completedAt" = case when p_action = 'APPROVE_REPORT' then now() else "completedAt" end,
        status = case when p_action = 'APPROVE_REPORT' then 'COMPLETED'
                      when p_action = 'REQUEST_CLARIFICATION' then 'CLARIFICATION_REQUESTED'
                      else status end,
        "updatedAt" = now()
    where id = v_workflow.id;
  end if;
end;
$$;

revoke all on function public.transition_internship_completion_workflow(text, text, jsonb) from public;
grant execute on function public.transition_internship_completion_workflow(text, text, jsonb) to authenticated;