-- Fix: department coordinator (and any) signup failed with HTTP 500
-- "Database error saving new user" because handle_new_user() inserted into
-- "User" with `on conflict (id) do nothing`, which does not cover the unique
-- "User_email_key" constraint. A stale "User" row that shares the signup email
-- but has a different id (an orphan with no matching auth.users row) made the
-- insert raise 23505, aborting the whole signup transaction.
--
-- This migration (1) removes those orphan rows and (2) replaces the trigger
-- function so it proactively clears a same-email orphan before inserting.

-- 1) Remove orphan profile rows (no matching auth user). These rows can never
--    log in, and they are what break new signups that reuse their email.
delete from "User" u
where not exists (select 1 from auth.users au where au.id = u.id);

-- 2) Make the trigger resilient to the email unique constraint.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role "Role";
begin
  v_role := case upper(replace(coalesce(new.raw_user_meta_data->>'role', 'STUDENT'), '-', '_'))
    when 'DEPARTMENT_COORDINATOR' then 'DEPARTMENT_COORDINATOR'::"Role"
    when 'FACULTY_COORDINATOR' then 'FACULTY_COORDINATOR'::"Role"
    else upper(replace(coalesce(new.raw_user_meta_data->>'role', 'STUDENT'), '-', '_'))::"Role"
  end;

  -- Clear a stale same-email profile row that has no matching auth user so the
  -- unique email constraint cannot abort the signup transaction.
  delete from "User"
  where email = new.email
    and not exists (select 1 from auth.users au where au.id = "User".id);

  insert into "User" (
    id, email, name, role, "isApproved", "coordinatorStatus", "emailVerified", "createdAt", "updatedAt"
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', ''),
    v_role,
    false,
    case when upper(coalesce(new.raw_user_meta_data->>'role', '')) in ('DEPARTMENT_COORDINATOR', 'DEPARTMENT-COORDINATOR', 'FACULTY_COORDINATOR', 'FACULTY-COORDINATOR') then 'PENDING'::"CoordinatorAccountStatus" else null end,
    new.email_confirmed_at is not null,
    now(),
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    name = excluded.name,
    role = excluded.role,
    "emailVerified" = excluded."emailVerified",
    "updatedAt" = now();

  if v_role = 'DEPARTMENT_COORDINATOR'::"Role" then
    insert into "DepartmentCoordinatorRequest" (
      id, "userId", "fullName", "officialEmail", "phoneNumber", "staffId",
      "institutionId", "facultyId", "departmentId", "positionTitle",
      "coordinatorResponsibility", "institutionName", "facultyName", "departmentName",
      status, "submittedAt", "createdAt", "updatedAt"
    )
    values (
      gen_random_uuid()::text,
      new.id,
      coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', ''),
      new.email,
      coalesce(new.raw_user_meta_data->>'phoneNumber', ''),
      coalesce(new.raw_user_meta_data->>'staffId', ''),
      nullif(new.raw_user_meta_data->>'institutionId', ''),
      nullif(new.raw_user_meta_data->>'facultyId', ''),
      nullif(new.raw_user_meta_data->>'departmentId', ''),
      coalesce(new.raw_user_meta_data->>'positionTitle', ''),
      coalesce(new.raw_user_meta_data->>'coordinatorResponsibility', ''),
      nullif(new.raw_user_meta_data->>'institutionName', ''),
      nullif(new.raw_user_meta_data->>'facultyName', ''),
      nullif(new.raw_user_meta_data->>'departmentName', ''),
      'PENDING'::"CoordinatorAccountStatus",
      now(), now(), now()
    )
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

grant execute on function public.handle_new_user() to postgres, service_role;
