alter table "InternshipCompletionWorkflow"
  add column if not exists "earlyEndReason" text,
  add column if not exists "earlyEndedAt" timestamptz;

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

  if v_workflow.status <> 'ACTIVE' or v_workflow."currentEndDate" <= current_date then
    raise exception 'Early ending is available only before the current internship end date.';
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