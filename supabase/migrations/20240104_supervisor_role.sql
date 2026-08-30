-- ============================================================
-- INTERNSHIPCONNECT — University Supervisor role
-- Run this in the Supabase SQL editor.
--
-- ADDITIVE migration. Does not remove or break the existing
-- STUDENT / RECRUITER / ADMIN workflows.
--
-- Adds:
--   * 'SUPERVISOR' to the "Role" enum
--   * new multi-stage statuses to the "LogbookStatus" enum
--   * a "SupervisorInvitation" table (invitation-only activation)
--   * "Internship"."supervisorId" (one supervisor per internship)
--   * "WeeklyLogbookReport"."supervisorComment" + supervisor reviewer
--   * RLS policies + grants for supervisor access
-- ============================================================

-- ---------- Role enum: add SUPERVISOR ----------
do $$ begin
  alter type "Role" add value 'SUPERVISOR';
exception when duplicate_object then null; end $$;

-- ---------- LogbookStatus enum: add multi-stage workflow states ----------
-- Existing rows still use DRAFT / SUBMITTED / APPROVED / REQUESTED_CHANGES.
-- New workflow states are added alongside them (reusing originals where
-- possible, adding the explicit supervisor stages the workflow requires).
do $$ begin
  alter type "LogbookStatus" add value 'PENDING_RECRUITER_REVIEW';
exception when duplicate_object then null; end $$;
do $$ begin
  alter type "LogbookStatus" add value 'RECRUITER_CHANGES_REQUESTED';
exception when duplicate_object then null; end $$;
do $$ begin
  alter type "LogbookStatus" add value 'RECRUITER_APPROVED';
exception when duplicate_object then null; end $$;
do $$ begin
  alter type "LogbookStatus" add value 'PENDING_SUPERVISOR_REVIEW';
exception when duplicate_object then null; end $$;
do $$ begin
  alter type "LogbookStatus" add value 'SUPERVISOR_CHANGES_REQUESTED';
exception when duplicate_object then null; end $$;
do $$ begin
  alter type "LogbookStatus" add value 'SUPERVISOR_APPROVED';
exception when duplicate_object then null; end $$;
do $$ begin
  alter type "LogbookStatus" add value 'COMPLETED';
exception when duplicate_object then null; end $$;

-- ---------- Internship: add supervisorId ----------
-- A single supervisor may supervise many students, so the supervisor is
-- linked at the internship level (mirrors how recruiterId works).
alter table "Internship"
  add column if not exists "supervisorId" text references "User" (id) on delete set null;

-- ---------- WeeklyLogbookReport: supervisor reviewer + comment ----------
-- reviewedById / reviewedAt already exist on the table; we reuse them to
-- record the final reviewer (recruiter or supervisor). Add a dedicated
-- supervisor comment column so recruiter and supervisor feedback coexist.
alter table "WeeklyLogbookReport"
  add column if not exists "supervisorComment" text;

-- ---------- SupervisorInvitation table ----------
-- Stores an invitation a student sends TO their university supervisor.
-- The activation link is /supervisor/activate/<rawToken>. Only the hashed
-- token is stored; 48h expiry; invalid after activation; status flows:
--   SENT -> ACTIVE  (activated)
-- internshipId is optional: when set, activating the invitation also assigns
-- the supervisor to that internship (Internship.supervisorId).
create table if not exists "SupervisorInvitation" (
  id text primary key,
  "studentId" text not null references "User" (id) on delete cascade,
  "internshipId" text references "Internship" (id) on delete set null,
  name text not null,
  email text not null,
  department text,
  university text,
  phone text,
  "tokenHash" text,
  "tokenExpiresAt" timestamptz,
  "activatedAt" timestamptz,
  "activatedById" text references "User" (id) on delete set null,
  status text not null default 'SENT',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
alter table "SupervisorInvitation" enable row level security;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- ---------- Internship: supervisor read/update via supervisorId ----------
drop policy if exists "Supervisors read assigned internships" on "Internship";
create policy "Supervisors read assigned internships" on "Internship"
  for select using (
    public.get_my_role() = 'SUPERVISOR'
    and "supervisorId" = auth.uid()::text
  );

-- ---------- Application: supervisors read applications for assigned internships ----------
drop policy if exists "Supervisors read applications for assigned internships" on "Application";
create policy "Supervisors read applications for assigned internships" on "Application"
  for select using (
    exists (
      select 1 from "Internship" i
      where i."id" = "Application"."internshipId" and i."supervisorId" = auth.uid()::text
    )
  );

-- ---------- WeeklyLogbookReport: supervisor access via internship.supervisorId ----------
drop policy if exists "Supervisors read reports for assigned internships" on "WeeklyLogbookReport";
create policy "Supervisors read reports for assigned internships" on "WeeklyLogbookReport"
  for select using (
    exists (
      select 1 from "Internship" i
      where i."id" = "WeeklyLogbookReport"."internshipId" and i."supervisorId" = auth.uid()::text
    )
  );

drop policy if exists "Supervisors update reports for assigned internships" on "WeeklyLogbookReport";
create policy "Supervisors update reports for assigned internships" on "WeeklyLogbookReport"
  for update using (
    exists (
      select 1 from "Internship" i
      where i."id" = "WeeklyLogbookReport"."internshipId" and i."supervisorId" = auth.uid()::text
    )
  );

-- ---------- SupervisorInvitation ----------
-- The inviting student manages their invitation; the invited supervisor reads
-- the invitation by its (hashed) token during activation; admins manage all.
drop policy if exists "Students read own supervisor invitations" on "SupervisorInvitation";
create policy "Students read own supervisor invitations" on "SupervisorInvitation"
  for select using (
    "studentId" = auth.uid()::text or public.get_my_role() = 'ADMIN'
  );

drop policy if exists "Students create supervisor invitations" on "SupervisorInvitation";
create policy "Students create supervisor invitations" on "SupervisorInvitation"
  for insert with check ("studentId" = auth.uid()::text);

drop policy if exists "Students update own supervisor invitations" on "SupervisorInvitation";
create policy "Students update own supervisor invitations" on "SupervisorInvitation"
  for update using ("studentId" = auth.uid()::text or public.get_my_role() = 'ADMIN');

-- ============================================================
-- GRANTS
-- ============================================================
grant all on table "SupervisorInvitation" to anon, authenticated;

-- ============================================================
-- SECURITY DEFINER: supervisor invitation activation
-- Activates an invitation by its raw token:
--   * validates the token (exists, not expired, not already used)
--   * reconciles an existing supervisor account by email
--   * creates/updates the supervisor "User" row
--   * assigns the supervisor to the invitation's internship (if any)
--
-- Returns jsonb with { success, message, supervisorId?, email? }
-- ============================================================
create or replace function public.activate_supervisor_invitation(
  p_raw_token text,
  p_user_id text,
  p_user_email text,
  p_user_name text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv "SupervisorInvitation"%rowtype;
  v_existing_id text;
  v_user_id text;
begin
  select * into v_inv
  from "SupervisorInvitation"
  where "tokenHash" = encode(sha256(convert_to(coalesce(p_raw_token, ''), 'UTF8')), 'hex')
  limit 1;

  if v_inv.id is null then
    return jsonb_build_object('success', false, 'message', 'Invalid invitation link.');
  end if;

  if v_inv."status" in ('ACTIVATED', 'ACTIVE') or v_inv."activatedAt" is not null then
    return jsonb_build_object('success', false, 'message', 'This invitation has already been used.');
  end if;

  if v_inv."tokenExpiresAt" is not null and v_inv."tokenExpiresAt" < now() then
    return jsonb_build_object('success', false, 'message', 'This invitation link has expired.');
  end if;

  -- Work out which user row should be the supervisor. Reuse an existing
  -- SUPERVISOR account with the same email if one exists.
  select id into v_existing_id
  from "User"
  where lower(email) = lower(p_user_email) and role = 'SUPERVISOR'
  limit 1;

  if v_existing_id is not null and v_existing_id <> p_user_id then
    -- Reconnect the existing supervisor row to this auth account: point it at
    -- this id and make sure the role is SUPERVISOR.
    update "User"
    set "role" = 'SUPERVISOR', "isApproved" = true, "emailVerified" = true, "updatedAt" = now()
    where id = v_existing_id;
    v_user_id := v_existing_id;
  else
    -- Ensure a SUPERVISOR row exists for this auth account.
    insert into "User" (id, email, name, role, "isApproved", "emailVerified", "createdAt", "updatedAt")
    values (p_user_id, p_user_email, coalesce(nullif(p_user_name, ''), 'Supervisor'), 'SUPERVISOR', true, true, now(), now())
    on conflict (id) do update set
      role = 'SUPERVISOR',
      name = coalesce("User".name, excluded.name),
      "isApproved" = true,
      "emailVerified" = true,
      "updatedAt" = now();
    v_user_id := p_user_id;
  end if;

  -- Mark the invitation activated.
  update "SupervisorInvitation"
  set "status" = 'ACTIVE',
      "activatedAt" = now(),
      "activatedById" = v_user_id,
      "updatedAt" = now()
  where id = v_inv.id;

  -- Assign the supervisor to the internship this invitation is tied to.
  if v_inv."internshipId" is not null then
    update "Internship"
    set "supervisorId" = v_user_id, "updatedAt" = now()
    where id = v_inv."internshipId";
  end if;

  return jsonb_build_object(
    'success', true,
    'message', 'Invitation activated.',
    'supervisorId', v_user_id,
    'email', p_user_email
  );
end;
$$;

grant execute on function public.activate_supervisor_invitation(text, text, text, text) to anon, authenticated;

-- ============================================================
-- SECURITY DEFINER: read a supervisor invitation by raw token
-- Used by the (public) activation page BEFORE the supervisor has an account.
-- Returns only safe, non-secret fields. Never returns tokenHash.
-- ============================================================
create or replace function public.get_supervisor_invitation(
  p_raw_token text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv "SupervisorInvitation"%rowtype;
begin
  select * into v_inv
  from "SupervisorInvitation"
  where "tokenHash" = encode(sha256(convert_to(coalesce(p_raw_token, ''), 'UTF8')), 'hex')
  limit 1;

  if v_inv.id is null then
    return jsonb_build_object('valid', false, 'reason', 'invalid');
  end if;

  if v_inv."status" in ('ACTIVATED', 'ACTIVE') or v_inv."activatedAt" is not null then
    return jsonb_build_object('valid', false, 'reason', 'used');
  end if;

  if v_inv."tokenExpiresAt" is not null and v_inv."tokenExpiresAt" < now() then
    return jsonb_build_object('valid', false, 'reason', 'expired');
  end if;

  return jsonb_build_object(
    'valid', true,
    'id', v_inv.id,
    'email', v_inv.email,
    'name', v_inv.name,
    'department', v_inv.department,
    'university', v_inv.university,
    'studentName', null
  );
end;
$$;

grant execute on function public.get_supervisor_invitation(text) to anon, authenticated;
