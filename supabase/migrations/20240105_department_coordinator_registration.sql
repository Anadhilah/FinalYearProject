-- Department Coordinator registration and approval support.
-- Apply this migration before using the public coordinator signup form.

do $$ begin
  alter type "Role" add value if not exists 'FACULTY_COORDINATOR';
  alter type "Role" add value if not exists 'DEPARTMENT_COORDINATOR';
exception when duplicate_object then null; end $$;

do $$ begin
  create type "CoordinatorAccountStatus" as enum ('PENDING', 'APPROVED', 'ACTIVE', 'REJECTED');
exception when duplicate_object then null; end $$;

alter table "User"
  add column if not exists "coordinatorStatus" "CoordinatorAccountStatus" default 'PENDING',
  add column if not exists "phoneNumber" text,
  add column if not exists "staffId" text,
  add column if not exists "institutionId" text references "Institution"(id),
  add column if not exists "facultyId" text references "FacultySchool"(id),
  add column if not exists "departmentId" text references "Department"(id),
  add column if not exists "positionTitle" text,
  add column if not exists "coordinatorResponsibility" text,
  add column if not exists "approvedAt" timestamptz,
  add column if not exists "activatedAt" timestamptz,
  add column if not exists "rejectedAt" timestamptz,
  add column if not exists "approvalReviewedById" text references "User"(id);

create table if not exists "DepartmentCoordinatorRequest" (
  id text primary key,
  "userId" text references "User"(id) on delete set null,
  "fullName" text not null,
  "officialEmail" text not null,
  "phoneNumber" text not null,
  "staffId" text not null,
  "institutionId" text not null references "Institution"(id) on delete restrict,
  "facultyId" text not null references "FacultySchool"(id) on delete restrict,
  "departmentId" text not null references "Department"(id) on delete restrict,
  "positionTitle" text not null,
  "coordinatorResponsibility" text not null,
  status "CoordinatorAccountStatus" not null default 'PENDING',
  "submittedAt" timestamptz not null default now(),
  "reviewedById" text references "User"(id) on delete set null,
  "reviewedAt" timestamptz,
  "rejectionReason" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
alter table "DepartmentCoordinatorRequest" enable row level security;

alter table "DepartmentCoordinatorRequest"
  alter column "institutionId" drop not null,
  alter column "facultyId" drop not null,
  alter column "departmentId" drop not null,
  add column if not exists "institutionName" text,
  add column if not exists "facultyName" text,
  add column if not exists "departmentName" text;

grant select, insert, update, delete on table "DepartmentCoordinatorRequest" to authenticated;

-- Institutional records are reference data used by the public signup form.
-- Allow users to select existing records, but do not allow public creation or edits.
grant select on table "Institution", "FacultySchool", "Department" to anon, authenticated;

drop policy if exists "Public can read institutions" on "Institution";
create policy "Public can read institutions" on "Institution"
  for select to anon, authenticated using (true);

drop policy if exists "Public can read faculties" on "FacultySchool";
create policy "Public can read faculties" on "FacultySchool"
  for select to anon, authenticated using (true);

drop policy if exists "Public can read departments" on "Department";
create policy "Public can read departments" on "Department"
  for select to anon, authenticated using (true);

-- Repair an earlier run that created camelCase names as lowercase identifiers.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'DepartmentCoordinatorRequest' and column_name = 'userid') then
    alter table "DepartmentCoordinatorRequest" rename column userid to "userId";
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'DepartmentCoordinatorRequest' and column_name = 'fullname') then
    alter table "DepartmentCoordinatorRequest" rename column fullname to "fullName";
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'DepartmentCoordinatorRequest' and column_name = 'officialemail') then
    alter table "DepartmentCoordinatorRequest" rename column officialemail to "officialEmail";
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'DepartmentCoordinatorRequest' and column_name = 'phonenumber') then
    alter table "DepartmentCoordinatorRequest" rename column phonenumber to "phoneNumber";
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'DepartmentCoordinatorRequest' and column_name = 'staffid') then
    alter table "DepartmentCoordinatorRequest" rename column staffid to "staffId";
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'DepartmentCoordinatorRequest' and column_name = 'institutionid') then
    alter table "DepartmentCoordinatorRequest" rename column institutionid to "institutionId";
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'DepartmentCoordinatorRequest' and column_name = 'facultyid') then
    alter table "DepartmentCoordinatorRequest" rename column facultyid to "facultyId";
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'DepartmentCoordinatorRequest' and column_name = 'departmentid') then
    alter table "DepartmentCoordinatorRequest" rename column departmentid to "departmentId";
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'DepartmentCoordinatorRequest' and column_name = 'positiontitle') then
    alter table "DepartmentCoordinatorRequest" rename column positiontitle to "positionTitle";
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'DepartmentCoordinatorRequest' and column_name = 'coordinatorresponsibility') then
    alter table "DepartmentCoordinatorRequest" rename column coordinatorresponsibility to "coordinatorResponsibility";
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'DepartmentCoordinatorRequest' and column_name = 'submittedat') then
    alter table "DepartmentCoordinatorRequest" rename column submittedat to "submittedAt";
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'DepartmentCoordinatorRequest' and column_name = 'reviewedbyid') then
    alter table "DepartmentCoordinatorRequest" rename column reviewedbyid to "reviewedById";
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'DepartmentCoordinatorRequest' and column_name = 'reviewedat') then
    alter table "DepartmentCoordinatorRequest" rename column reviewedat to "reviewedAt";
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'DepartmentCoordinatorRequest' and column_name = 'rejectionreason') then
    alter table "DepartmentCoordinatorRequest" rename column rejectionreason to "rejectionReason";
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'DepartmentCoordinatorRequest' and column_name = 'createdat') then
    alter table "DepartmentCoordinatorRequest" rename column createdat to "createdAt";
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'DepartmentCoordinatorRequest' and column_name = 'updatedat') then
    alter table "DepartmentCoordinatorRequest" rename column updatedat to "updatedAt";
  end if;
end $$;

drop policy if exists "Admins manage coordinator requests" on "DepartmentCoordinatorRequest";
create policy "Admins manage coordinator requests" on "DepartmentCoordinatorRequest"
  for all using (public.get_my_role() = 'ADMIN')
  with check (public.get_my_role() = 'ADMIN');

drop policy if exists "Applicants read own coordinator request" on "DepartmentCoordinatorRequest";
create policy "Applicants read own coordinator request" on "DepartmentCoordinatorRequest"
  for select using (auth.uid()::text = "userId");

drop policy if exists "Applicants create own coordinator request" on "DepartmentCoordinatorRequest";
create policy "Applicants create own coordinator request" on "DepartmentCoordinatorRequest"
  for insert with check (auth.uid()::text = "userId");

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

  -- Remove a stale profile row that shares this email but has no matching auth
  -- user (an orphan left behind when an auth user was deleted). Without this
  -- the unique "User_email_key" constraint aborts the signup transaction and
  -- GoTrue reports a generic "Database error saving new user".
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

drop function if exists public.ensure_user_profile(text, text, text, text, boolean, boolean, text, text, text, text, text);
create or replace function public.ensure_user_profile(
  p_id text,
  p_email text,
  p_name text,
  p_role text,
  p_is_approved boolean,
  p_email_verified boolean,
  p_recruiter_status text,
  p_coordinator_status text,
  p_phone_number text,
  p_staff_id text,
  p_institution_id text,
  p_faculty_id text,
  p_department_id text,
  p_position_title text,
  p_coordinator_responsibility text,
  p_company text,
  p_industry text,
  p_registration_number text,
  p_proof_doc_url text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role "Role";
  v_coordinator_status "CoordinatorAccountStatus";
  v_result jsonb;
begin
  v_role := case upper(replace(p_role, '-', '_'))
    when 'DEPARTMENT_COORDINATOR' then 'DEPARTMENT_COORDINATOR'::"Role"
    when 'FACULTY_COORDINATOR' then 'FACULTY_COORDINATOR'::"Role"
    else upper(replace(p_role, '-', '_'))::"Role"
  end;
  v_coordinator_status := case when v_role in ('DEPARTMENT_COORDINATOR', 'FACULTY_COORDINATOR') then coalesce(nullif(upper(p_coordinator_status), ''), 'PENDING')::"CoordinatorAccountStatus" else null end;

  insert into "User" (
    id, email, name, role, "isApproved", "emailVerified", "recruiterStatus", "coordinatorStatus",
    company, industry, "registrationNumber", "proofDocUrl", "phoneNumber", "staffId",
    "institutionId", "facultyId", "departmentId", "positionTitle", "coordinatorResponsibility", "createdAt", "updatedAt"
  ) values (
    p_id, p_email, p_name, v_role, p_is_approved, p_email_verified,
    case when p_recruiter_status is null then null else upper(p_recruiter_status)::"RecruiterStatus" end,
    v_coordinator_status, p_company, p_industry, p_registration_number, p_proof_doc_url,
    p_phone_number, p_staff_id, p_institution_id, p_faculty_id, p_department_id,
    p_position_title, p_coordinator_responsibility, now(), now()
  )
  on conflict (id) do update set
    email = excluded.email,
    name = excluded.name,
    role = excluded.role,
    "isApproved" = excluded."isApproved",
    "emailVerified" = excluded."emailVerified",
    "recruiterStatus" = coalesce(excluded."recruiterStatus", "User"."recruiterStatus"),
    "coordinatorStatus" = coalesce(excluded."coordinatorStatus", "User"."coordinatorStatus"),
    company = coalesce(excluded.company, "User".company),
    industry = coalesce(excluded.industry, "User".industry),
    "registrationNumber" = coalesce(excluded."registrationNumber", "User"."registrationNumber"),
    "proofDocUrl" = coalesce(excluded."proofDocUrl", "User"."proofDocUrl"),
    "phoneNumber" = coalesce(excluded."phoneNumber", "User"."phoneNumber"),
    "staffId" = coalesce(excluded."staffId", "User"."staffId"),
    "institutionId" = coalesce(excluded."institutionId", "User"."institutionId"),
    "facultyId" = coalesce(excluded."facultyId", "User"."facultyId"),
    "departmentId" = coalesce(excluded."departmentId", "User"."departmentId"),
    "positionTitle" = coalesce(excluded."positionTitle", "User"."positionTitle"),
    "coordinatorResponsibility" = coalesce(excluded."coordinatorResponsibility", "User"."coordinatorResponsibility"),
    "updatedAt" = now();

  select to_jsonb(u) into v_result from "User" u where u.id = p_id;
  return v_result;
end;
$$;

grant execute on function public.ensure_user_profile(text, text, text, text, boolean, boolean, text, text, text, text, text, text, text, text, text, text, text, text, text) to anon, authenticated;

create or replace function public.activate_department_coordinator(
  p_position_title text,
  p_coordinator_responsibility text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user "User"%rowtype;
begin
  select * into v_user from "User" where id = auth.uid()::text;

  if v_user.id is null or v_user.role <> 'DEPARTMENT_COORDINATOR'::"Role" then
    return jsonb_build_object('success', false, 'message', 'Coordinator account not found.');
  end if;
  if v_user."coordinatorStatus" <> 'APPROVED'::"CoordinatorAccountStatus" then
    return jsonb_build_object('success', false, 'message', 'Your coordinator account has not been approved for activation.');
  end if;

  update "User"
  set "coordinatorStatus" = 'ACTIVE'::"CoordinatorAccountStatus",
      "isApproved" = true,
      "positionTitle" = nullif(trim(p_position_title), ''),
      "coordinatorResponsibility" = nullif(trim(p_coordinator_responsibility), ''),
      "activatedAt" = now(),
      "updatedAt" = now()
  where id = auth.uid()::text;

  update "DepartmentCoordinatorRequest"
  set status = 'ACTIVE'::"CoordinatorAccountStatus",
      "updatedAt" = now()
  where "userId" = auth.uid()::text and status = 'APPROVED'::"CoordinatorAccountStatus";

  return jsonb_build_object('success', true, 'message', 'Coordinator account activated.');
end;
$$;

grant execute on function public.activate_department_coordinator(text, text) to authenticated;
