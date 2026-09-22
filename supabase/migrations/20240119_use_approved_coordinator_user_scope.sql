-- Use the approved Department Coordinator profile as the invitation scope source.
-- Apply after 20240118_resolve_coordinator_department_scope.sql.

grant select, insert on table "CoordinatorInvitation" to authenticated;

drop policy if exists "Department coordinators create faculty invitations" on "CoordinatorInvitation";
create policy "Department coordinators create faculty invitations" on "CoordinatorInvitation"
  for insert to authenticated
  with check (
    "createdById" = auth.uid()::text
    and upper(replace(coalesce(role, ''), '-', '_')) = 'FACULTY_COORDINATOR'
    and exists (
      select 1
      from "User" u
      where u.id = auth.uid()::text
        and u.role = 'DEPARTMENT_COORDINATOR'::"Role"
        and u."coordinatorStatus" in ('APPROVED', 'ACTIVE')
        and u."isApproved" = true
    )
  );

create or replace function public.create_faculty_coordinator_invitation(
  p_id text,
  p_email text,
  p_name text,
  p_token_hash text,
  p_token_expires_at timestamptz
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user "User"%rowtype;
  v_invitation "CoordinatorInvitation"%rowtype;
begin
  select * into v_user
  from "User"
  where id = auth.uid()::text;

  if v_user.id is null
     or v_user.role <> 'DEPARTMENT_COORDINATOR'::"Role"
     or v_user."coordinatorStatus" not in ('APPROVED', 'ACTIVE')
     or coalesce(v_user."isApproved", false) = false then
    return jsonb_build_object(
      'success', false,
      'message', 'Only an approved or active Department Coordinator can create this invitation.'
    );
  end if;

  insert into "CoordinatorInvitation" (
    id, email, name, role, "tokenHash", "tokenExpiresAt", status, "createdById",
    "institutionId", "facultyId", "departmentId", "createdAt", "updatedAt"
  ) values (
    p_id,
    trim(p_email),
    nullif(trim(p_name), ''),
    'FACULTY_COORDINATOR',
    p_token_hash,
    p_token_expires_at,
    'SENT',
    auth.uid()::text,
    v_user."institutionId",
    v_user."facultyId",
    v_user."departmentId",
    now(),
    now()
  ) returning * into v_invitation;

  return jsonb_build_object('success', true, 'invitation', to_jsonb(v_invitation));
end;
$$;

grant execute on function public.create_faculty_coordinator_invitation(text, text, text, text, timestamptz) to authenticated;
