drop policy if exists "Recruiters update own internship applications" on "Application";
drop policy if exists "Recruiters update approved internship applications" on "Application";

create policy "Recruiters update approved internship applications" on "Application"
  for update to authenticated
  using (
    "departmentReviewStatus" in ('NOT_REQUIRED', 'APPROVED')
    and status not in ('ACCEPTED', 'OFFER_ACCEPTED', 'OFFER_DECLINED')
    and exists (
      select 1 from "Internship" i
      where i.id = "Application"."internshipId"
        and i."recruiterId" = auth.uid()::text
    )
  )
  with check (
    "departmentReviewStatus" in ('NOT_REQUIRED', 'APPROVED')
    and status not in ('ACCEPTED', 'OFFER_ACCEPTED', 'OFFER_DECLINED')
    and exists (
      select 1 from "Internship" i
      where i.id = "Application"."internshipId"
        and i."recruiterId" = auth.uid()::text
    )
  );

create or replace function public.respond_to_internship_offer(
  p_application_id text,
  p_decision text
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_application "Application"%rowtype;
  v_decision text := upper(coalesce(p_decision, ''));
begin
  if auth.uid() is null or public.get_my_role() is distinct from 'STUDENT' then
    raise exception 'Only the student can respond to this internship offer.';
  end if;

  if v_decision not in ('ACCEPT', 'DECLINE') then
    raise exception 'Unknown internship offer decision.';
  end if;

  select * into v_application
  from "Application"
  where id = p_application_id;

  if v_application.id is null or v_application."studentId" <> auth.uid()::text then
    raise exception 'Application not found.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_application."studentId", 0));

  select * into v_application
  from "Application"
  where id = p_application_id
  for update;

  if v_application.status <> 'OFFER_SENT' then
    raise exception 'This internship offer is no longer awaiting your decision.';
  end if;

  if v_decision = 'ACCEPT' and exists (
    select 1
    from "Application" other_application
    where other_application."studentId" = v_application."studentId"
      and other_application.id <> v_application.id
      and other_application.status in ('ACCEPTED', 'OFFER_ACCEPTED')
  ) then
    raise exception 'You already have an accepted internship placement.';
  end if;

  if v_decision = 'ACCEPT' then
    update "Application"
    set status = 'OFFER_DECLINED', "updatedAt" = now()
    where "studentId" = v_application."studentId"
      and id <> v_application.id
      and status = 'OFFER_SENT';
  end if;

  update "Application"
  set status = case when v_decision = 'ACCEPT' then 'OFFER_ACCEPTED'::"ApplicationStatus"
                    else 'OFFER_DECLINED'::"ApplicationStatus" end,
      "updatedAt" = now()
  where id = v_application.id;

  return jsonb_build_object('success', true);
end;
$$;

revoke all on function public.respond_to_internship_offer(text, text) from public;
grant execute on function public.respond_to_internship_offer(text, text) to authenticated;