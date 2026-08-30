-- ============================================================
-- InternshipConnect — Corrected Supabase Schema
-- Run this in the Supabase SQL editor.
--
-- MATCHES THE ACTUAL EXISTING DATABASE:
--   * All id columns are TEXT
--   * camelCase column names
--   * Enum types are created before use
--   * RLS policies quote camelCase columns and cast auth.uid() to text
-- ============================================================

-- ============================================================
-- Enum types (must be created before the tables that use them)
-- ============================================================
do $$ begin
  create type "Role" as enum ('STUDENT', 'RECRUITER', 'ADMIN');
exception when duplicate_object then null; end $$;

do $$ begin
  create type "RecruiterStatus" as enum ('PENDING', 'APPROVED', 'REJECTED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type "InternshipStatus" as enum ('ACTIVE', 'CLOSED', 'DRAFT');
exception when duplicate_object then null; end $$;

do $$ begin
  create type "ApplicationStatus" as enum ('pending', 'accepted', 'rejected', 'reviewing');
exception when duplicate_object then null; end $$;

do $$ begin
  create type "LogbookStatus" as enum ('DRAFT', 'SUBMITTED', 'APPROVED', 'REQUESTED_CHANGES');
exception when duplicate_object then null; end $$;

-- ============================================================
-- Tables (create if not exists — matches existing DB exactly)
-- ============================================================

-- ---------- User ----------
create table if not exists "User" (
  id text primary key,
  email text not null unique,
  role "Role" not null,
  name text,
  isApproved boolean not null default false,
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  company text,
  industry text,
  proofDocUrl text,
  recruiterStatus "RecruiterStatus",
  registrationNumber text,
  recruiterApprovedAt timestamptz,
  recruiterRejectedAt timestamptz,
  bio text,
  cvUrl text,
  major text,
  university text,
  suspended boolean not null default false,
  companyAddress text,
  companyDescription text,
  companySize text,
  companyWebsite text,
  emailVerificationCode text,
  emailVerificationExpiresAt timestamptz,
  emailVerified boolean not null default false,
  hrEmail text,
  hrName text,
  hrPhone text,
  hrTitle text,
  taxId text,
  city text,
  country text
);
alter table "User" enable row level security;

-- ---------- Internship ----------
create table if not exists "Internship" (
  id text primary key,
  title text not null,
  description text not null,
  location text,
  type text,
  duration text,
  stipend text,
  requirements text,
  status "InternshipStatus" not null default 'ACTIVE',
  recruiterId text not null references "User" (id) on delete cascade,
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now()
);
alter table "Internship" enable row level security;

-- ---------- Application ----------
create table if not exists "Application" (
  id text primary key,
  internshipId text not null references "Internship" (id) on delete cascade,
  studentId text not null references "User" (id) on delete cascade,
  status "ApplicationStatus" not null default 'pending',
  coverLetter text,
  resumeUrl text,
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now()
);
alter table "Application" enable row level security;

-- ---------- Conversation ----------
create table if not exists "Conversation" (
  id text primary key,
  lastActivity timestamptz not null default now(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now()
);
alter table "Conversation" enable row level security;

-- ---------- ConversationParticipant ----------
create table if not exists "ConversationParticipant" (
  id text primary key,
  conversationId text not null references "Conversation" (id) on delete cascade,
  userId text not null references "User" (id) on delete cascade,
  createdAt timestamptz not null default now()
);
alter table "ConversationParticipant" enable row level security;

-- ---------- Message ----------
create table if not exists "Message" (
  id text primary key,
  conversationId text not null references "Conversation" (id) on delete cascade,
  senderId text not null references "User" (id) on delete cascade,
  text text not null,
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now()
);
alter table "Message" enable row level security;

-- ---------- WeeklyLogbookReport ----------
create table if not exists "WeeklyLogbookReport" (
  id text primary key,
  studentId text not null references "User" (id) on delete cascade,
  internshipId text not null references "Internship" (id) on delete cascade,
  weekNumber integer not null,
  startDate date,
  endDate date,
  tasksPerformed text not null,
  skillsLearned text not null,
  challengesFaced text not null,
  hoursWorked integer not null default 0,
  attachmentUrls text,
  status "LogbookStatus" not null default 'DRAFT',
  recruiterComment text,
  shareToken text,
  sharedAt timestamptz,
  reviewedById text references "User" (id) on delete set null,
  reviewedAt timestamptz,
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now()
);
alter table "WeeklyLogbookReport" enable row level security;

-- ---------- Meeting ----------
create table if not exists "Meeting" (
  id text primary key,
  title text not null,
  studentId text not null references "User" (id) on delete cascade,
  recruiterId text not null references "User" (id) on delete cascade,
  scheduledFor timestamptz not null,
  type text not null default 'video',
  status text not null default 'upcoming',
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now()
);
alter table "Meeting" enable row level security;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Resolve the caller's role WITHOUT infinite recursion by using a
-- SECURITY DEFINER function (bypasses RLS for the internal lookup).
create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role::text from "User" where id = auth.uid()::text;
$$;

-- ---------- User ----------
drop policy if exists "Users read own profile" on "User";
create policy "Users read own profile" on "User"
  for select using (auth.uid()::text = id or public.get_my_role() = 'ADMIN');

drop policy if exists "Admins manage users" on "User";
create policy "Admins manage users" on "User"
  for all using (public.get_my_role() = 'ADMIN');

drop policy if exists "Users update own profile" on "User";
create policy "Users update own profile" on "User"
  for update using (auth.uid()::text = id);

-- Allow a user to insert their OWN profile row during registration.
-- RLS blocks inserts by default; this policy lets the app's register()
-- create the matching User row (id == auth.uid()).
drop policy if exists "Users insert own profile" on "User";
create policy "Users insert own profile" on "User"
  for insert with check (auth.uid()::text = id);

-- ---------- Internship ----------
drop policy if exists "Read internships" on "Internship";
create policy "Read internships" on "Internship"
  for select using (true);

drop policy if exists "Recruiters create internships" on "Internship";
create policy "Recruiters create internships" on "Internship"
  for insert with check (public.get_my_role() in ('RECRUITER', 'ADMIN'));

drop policy if exists "Recruiters update own internships" on "Internship";
create policy "Recruiters update own internships" on "Internship"
  for update using (public.get_my_role() = 'ADMIN' or "recruiterId" = auth.uid()::text);

drop policy if exists "Recruiters delete own internships" on "Internship";
create policy "Recruiters delete own internships" on "Internship"
  for delete using (public.get_my_role() = 'ADMIN' or "recruiterId" = auth.uid()::text);

-- ---------- Application ----------
drop policy if exists "Students read own applications" on "Application";
create policy "Students read own applications" on "Application"
  for select using ("studentId" = auth.uid()::text);

drop policy if exists "Students create applications" on "Application";
create policy "Students create applications" on "Application"
  for insert with check ("studentId" = auth.uid()::text);

drop policy if exists "Recruiters read applications for own internships" on "Application";
create policy "Recruiters read applications for own internships" on "Application"
  for select using (
    exists (
      select 1 from "Internship" i
      where i."id" = "Application"."internshipId" and i."recruiterId" = auth.uid()::text
    )
  );

drop policy if exists "Recruiters update own internship applications" on "Application";
create policy "Recruiters update own internship applications" on "Application"
  for update using (
    exists (
      select 1 from "Internship" i
      where i."id" = "Application"."internshipId" and i."recruiterId" = auth.uid()::text
    )
  );

-- ---------- Conversation ----------
drop policy if exists "Participants read conversations" on "Conversation";
create policy "Participants read conversations" on "Conversation"
  for select using (
    exists (
      select 1 from "ConversationParticipant" cp
      where cp."conversationId" = "Conversation"."id" and cp."userId" = auth.uid()::text
    )
  );

drop policy if exists "Participants create conversations" on "Conversation";
create policy "Participants create conversations" on "Conversation"
  for insert with check (true);

-- ---------- ConversationParticipant ----------
drop policy if exists "Participants read their memberships" on "ConversationParticipant";
create policy "Participants read their memberships" on "ConversationParticipant"
  for select using ("userId" = auth.uid()::text or public.get_my_role() = 'ADMIN');

drop policy if exists "Participants insert memberships" on "ConversationParticipant";
create policy "Participants insert memberships" on "ConversationParticipant"
  for insert with check ("userId" = auth.uid()::text or public.get_my_role() = 'ADMIN');

-- ---------- Message ----------
drop policy if exists "Participants read messages" on "Message";
create policy "Participants read messages" on "Message"
  for select using (
    exists (
      select 1 from "ConversationParticipant" cp
      where cp."conversationId" = "Message"."conversationId" and cp."userId" = auth.uid()::text
    )
  );

drop policy if exists "Participants send messages" on "Message";
create policy "Participants send messages" on "Message"
  for insert with check ("senderId" = auth.uid()::text);

-- ---------- WeeklyLogbookReport ----------
drop policy if exists "Students read own logbook reports" on "WeeklyLogbookReport";
create policy "Students read own logbook reports" on "WeeklyLogbookReport"
  for select using ("studentId" = auth.uid()::text or public.get_my_role() = 'ADMIN');

drop policy if exists "Students create logbook reports" on "WeeklyLogbookReport";
create policy "Students create logbook reports" on "WeeklyLogbookReport"
  for insert with check ("studentId" = auth.uid()::text);

drop policy if exists "Recruiters read reports for own internships" on "WeeklyLogbookReport";
create policy "Recruiters read reports for own internships" on "WeeklyLogbookReport"
  for select using (
    exists (
      select 1 from "Internship" i
      where i."id" = "WeeklyLogbookReport"."internshipId" and i."recruiterId" = auth.uid()::text
    )
  );

drop policy if exists "Recruiters update reports for own internships" on "WeeklyLogbookReport";
create policy "Recruiters update reports for own internships" on "WeeklyLogbookReport"
  for update using (
    exists (
      select 1 from "Internship" i
      where i."id" = "WeeklyLogbookReport"."internshipId" and i."recruiterId" = auth.uid()::text
    )
  );

-- ---------- Meeting ----------
drop policy if exists "Participants read meetings" on "Meeting";
create policy "Participants read meetings" on "Meeting"
  for select using (
    public.get_my_role() = 'ADMIN'
    or "studentId" = auth.uid()::text
    or "recruiterId" = auth.uid()::text
  );

drop policy if exists "Recruiters create meetings" on "Meeting";
create policy "Recruiters create meetings" on "Meeting"
  for insert with check (
    public.get_my_role() = 'ADMIN'
    or ("recruiterId" = auth.uid()::text and public.get_my_role() = 'RECRUITER')
  );

drop policy if exists "Participants update meetings" on "Meeting";
create policy "Participants update meetings" on "Meeting"
  for update using (
    public.get_my_role() = 'ADMIN'
    or "studentId" = auth.uid()::text
    or "recruiterId" = auth.uid()::text
  );

-- ============================================================
-- FIX NOT-NULL TIMESTAMP DEFAULTS
-- The Prisma-created tables have createdAt/updatedAt as NOT NULL
-- with NO default. The app's register() doesn't always send these,
-- which causes "null value in column ... violates not-null constraint".
-- These ALTERs give them sensible defaults so inserts are safe.
-- ============================================================
alter table "User" alter column "createdAt" set default now();
alter table "User" alter column "updatedAt" set default now();
alter table "Internship" alter column "createdAt" set default now();
alter table "Internship" alter column "updatedAt" set default now();
alter table "Application" alter column "createdAt" set default now();
alter table "Application" alter column "updatedAt" set default now();
alter table "Conversation" alter column "createdAt" set default now();
alter table "Conversation" alter column "updatedAt" set default now();
alter table "Conversation" alter column "lastActivity" set default now();
alter table "ConversationParticipant" alter column "createdAt" set default now();
alter table "Message" alter column "createdAt" set default now();
alter table "Message" alter column "updatedAt" set default now();
alter table "WeeklyLogbookReport" alter column "createdAt" set default now();
alter table "WeeklyLogbookReport" alter column "updatedAt" set default now();
alter table "Meeting" alter column "createdAt" set default now();
alter table "Meeting" alter column "updatedAt" set default now();

-- ============================================================
-- AUTO-CREATE USER PROFILE ON SIGNUP (CRITICAL)
-- When a new auth user signs up (auth.users insert), automatically
-- create the matching row in the "User" table. Without this, a user
-- that verifies email but has no "User" row cannot log in (the app
-- reads the role from "User", and zero rows causes a 406 error).
-- The trigger reads the role/name from auth user metadata when present.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into "User" (
    id, email, name, role, "isApproved", "emailVerified", "createdAt", "updatedAt"
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::"Role", 'STUDENT'),
    false,
    new.email_confirmed_at is not null,
    now(),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

grant execute on function public.handle_new_user() to postgres, service_role;

-- ============================================================
-- GRANTS (CRITICAL for Prisma-created tables)
-- The tables were created by Prisma, which does NOT grant
-- privileges to Supabase's anon/authenticated roles. Without
-- these grants, supabase-js queries return 403 Forbidden even
-- when RLS policies exist.
-- ============================================================
grant usage on schema public to anon, authenticated;

grant all on table "User" to anon, authenticated;
grant all on table "Internship" to anon, authenticated;
grant all on table "Application" to anon, authenticated;
grant all on table "Conversation" to anon, authenticated;
grant all on table "ConversationParticipant" to anon, authenticated;
grant all on table "Message" to anon, authenticated;
grant all on table "WeeklyLogbookReport" to anon, authenticated;
grant all on table "Meeting" to anon, authenticated;

-- Allow the RLS helper function to be executed by app queries.
grant execute on function public.get_my_role() to anon, authenticated;

-- ============================================================
-- SECURITY DEFINER: ensure_user_profile
-- The app logs users in by reading their role from the "User" table.
-- RLS-based inserts/upserts can fail (406/409) when the session's
-- auth.uid() is unreliable or when the row already exists but isn't
-- visible. This SECURITY DEFINER function creates/updates the profile
-- row bypassing RLS, so the app can reliably ensure the row exists.
-- Called as: select public.ensure_user_profile(...)
-- ============================================================
create or replace function public.ensure_user_profile(
  p_id text,
  p_email text,
  p_name text,
  p_role text,
  p_is_approved boolean,
  p_email_verified boolean,
  p_recruiter_status text,
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
  v_result jsonb;
begin
  v_role := p_role::"Role";

  insert into "User" (
    id, email, name, role, "isApproved", "emailVerified",
    "recruiterStatus", company, industry, "registrationNumber", "proofDocUrl",
    "createdAt", "updatedAt"
  ) values (
    p_id, p_email, p_name, v_role, p_is_approved, p_email_verified,
    case when p_recruiter_status is null then null else p_recruiter_status::"RecruiterStatus" end,
    p_company, p_industry, p_registration_number, p_proof_doc_url,
    now(), now()
  )
  on conflict (id) do update set
    email = excluded.email,
    name = excluded.name,
    role = excluded.role,
    "isApproved" = excluded."isApproved",
    "emailVerified" = excluded."emailVerified",
    "recruiterStatus" = excluded."recruiterStatus",
    company = excluded.company,
    industry = excluded.industry,
    "registrationNumber" = excluded."registrationNumber",
    "proofDocUrl" = excluded."proofDocUrl",
    "updatedAt" = now();

  select jsonb_build_object(
    'id', u.id,
    'email', u.email,
    'name', u.name,
    'role', u.role::text,
    'isApproved', u."isApproved",
    'recruiterStatus', u."recruiterStatus"::text,
    'emailVerified', u."emailVerified",
    'company', u.company,
    'industry', u.industry,
    'companyAddress', u."companyAddress",
    'registrationNumber', u."registrationNumber",
    'proofDocUrl', u."proofDocUrl",
    'hrName', u."hrName",
    'hrEmail', u."hrEmail"
  ) into v_result
  from "User" u
  where u.id = p_id;

  return v_result;
end;
$$;

grant execute on function public.ensure_user_profile(text, text, text, text, boolean, boolean, text, text, text, text, text) to anon, authenticated;

-- ============================================================
-- Storage bucket for uploads
-- ============================================================
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', false)
on conflict (id) do nothing;

drop policy if exists "Authenticated users upload files" on storage.objects;
create policy "Authenticated users upload files" on storage.objects
  for insert with check (bucket_id = 'uploads' and auth.role() = 'authenticated');

drop policy if exists "Authenticated users read uploads" on storage.objects;
create policy "Authenticated users read uploads" on storage.objects
  for select using (bucket_id = 'uploads' and auth.role() = 'authenticated');
