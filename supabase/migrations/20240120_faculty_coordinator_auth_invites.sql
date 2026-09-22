-- Support Supabase Auth invitations for Faculty Coordinators.

do $$ begin
  alter type "CoordinatorAccountStatus" add value if not exists 'PENDING_ACTIVATION';
exception when duplicate_object then null; end $$;

alter table "CoordinatorInvitation"
  add column if not exists "staffId" text;

grant select on table "CoordinatorInvitation" to authenticated;

drop function if exists public.activate_faculty_coordinator_account(text);
create or replace function public.activate_faculty_coordinator_account(
  p_name text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user "User"%rowtype;
  v_invitation "CoordinatorInvitation"%rowtype;
begin
  select * into v_user from "User" where id = auth.uid()::text;
  if v_user.id is null or v_user.role <> 'FACULTY_COORDINATOR'::"Role" then
    return jsonb_build_object('success', false, 'message', 'Faculty Coordinator profile not found.');
  end if;

  select * into v_invitation
  from "CoordinatorInvitation"
  where lower(email) = lower(v_user.email)
    and upper(replace(coalesce(role, ''), '-', '_')) = 'FACULTY_COORDINATOR'
    and status not in ('ACTIVATED', 'ACTIVE')
  order by "createdAt" desc
  limit 1;

  if v_invitation.id is null then
    return jsonb_build_object('success', false, 'message', 'No pending Faculty Coordinator invitation was found.');
  end if;

  update "User"
  set name = coalesce(nullif(trim(p_name), ''), name),
      "coordinatorStatus" = 'ACTIVE'::"CoordinatorAccountStatus",
      "isApproved" = true,
      "emailVerified" = true,
      "activatedAt" = now(),
      "updatedAt" = now()
  where id = auth.uid()::text;

  update "CoordinatorInvitation"
  set status = 'ACTIVATED',
      "activatedAt" = now(),
      "activatedById" = auth.uid()::text,
      "updatedAt" = now()
  where id = v_invitation.id;

  return jsonb_build_object('success', true, 'message', 'Faculty Coordinator account activated.');
end;
$$;

grant execute on function public.activate_faculty_coordinator_account(text) to authenticated;
