-- ============================================================
-- File: 20240112_application_workflow.sql
-- ============================================================
-- Complete student internship application workflow.
--
-- Adds:
--   * Recruiter-specific application questions per internship.
--   * Internship application deadline and optional fixed availability dates.
--   * Separate organisation (Application.status) and department review
--     (Application.departmentReviewStatus) tracking.
--   * Cover letter file reference (kept separate from the message text).
--   * Per-application skills, expected availability and question answers.
--   * Optional Department Coordinator support request.
--   * Profile skills used to pre-fill the application form.
--   * A SECURITY DEFINER RPC so coordinators can only record review outcomes
--     and never edit the rest of a student's application.
--   * Storage hardening: uploads are owned per-user folders; organisations
--     and scoped coordinators can only read documents referenced from the
--     applications they are authorised to view.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Department review status enum (separate from ApplicationStatus)
-- ------------------------------------------------------------
do $$ begin
  create type "DepartmentReviewStatus" as enum ('NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------
-- 2. Internship: application deadline, fixed availability, recruiter questions
-- ------------------------------------------------------------
alter table "Internship"
  add column if not exists "applicationDeadline" timestamptz,
  add column if not exists "startDate" date,
  add column if not exists "endDate" date,
  add column if not exists "applicationQuestions" jsonb not null default '[]'::jsonb;

-- ------------------------------------------------------------
-- 3. Application: documents, skills, availability, answers, coordinator support
-- ------------------------------------------------------------
alter table "Application"
  add column if not exists "coverLetterUrl" text,
  add column if not exists "coordinatorSupportRequested" boolean not null default false,
  add column if not exists "departmentReviewStatus" "DepartmentReviewStatus" not null default 'NOT_REQUIRED',
  add column if not exists "skills" text[] not null default '{}'::text[],
  add column if not exists "startDate" date,
  add column if not exists "endDate" date,
  add column if not exists "questionAnswers" jsonb not null default '[]'::jsonb;

-- ------------------------------------------------------------
-- 4. Profile skills (pre-fill source for the application form)
-- ------------------------------------------------------------
alter table "User"
  add column if not exists "skills" text[] not null default '{}'::text[];

-- ------------------------------------------------------------
-- 5. Department coordinator review RPC
-- ------------------------------------------------------------
-- Coordinators record review outcomes through this SECURITY DEFINER function
-- instead of a raw UPDATE, so they can never alter the student's application
-- content. Approved applications become visible to the organisation; rejected
-- applications keep the organisation's status unchanged but stay out of the
-- recruiter's queue when institutional review was mandatory.
create or replace function public.review_department_application(
  p_application_id text,
  p_decision text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row "Application"%rowtype;
  v_affiliation "StudentInstitutionAffiliation"%rowtype;
  v_decision text;
begin
  v_decision := upper(coalesce(p_decision, ''));

  select * into v_row
  from "Application"
  where id = p_application_id
  limit 1;

  if v_row.id is null then
    return jsonb_build_object('success', false, 'message', 'Application not found.');
  end if;

  if auth.uid() is null or public.get_my_role() <> 'DEPARTMENT_COORDINATOR' then
    return jsonb_build_object('success', false, 'message', 'Only a Department Coordinator can review this application.');
  end if;

  if v_row."departmentReviewStatus" <> 'PENDING' and v_row."coordinatorSupportRequested" <> true then
    return jsonb_build_object('success', false, 'message', 'This application is not awaiting department review.');
  end if;

  select * into v_affiliation
  from "StudentInstitutionAffiliation"
  where "studentId" = v_row."studentId"
    and "isPrimary" = true
  limit 1;

  if v_affiliation.id is null
     or not public.can_read_student_affiliation(
       v_affiliation."institutionId",
       v_affiliation."facultyId",
       v_affiliation."departmentId",
       v_row."studentId"
     ) then
    return jsonb_build_object('success', false, 'message', 'This application is outside your department scope.');
  end if;

  if v_decision = 'APPROVED' then
    update "Application"
    set "departmentReviewStatus" = 'APPROVED'::"DepartmentReviewStatus",
        "departmentApprovalRequired" = false,
        "updatedAt" = now()
    where id = p_application_id;
    return jsonb_build_object('success', true, 'message', 'Application approved.');
  end if;

  if v_decision = 'REJECTED' then
    update "Application"
    set "departmentReviewStatus" = 'REJECTED'::"DepartmentReviewStatus",
        "updatedAt" = now()
    where id = p_application_id;
    return jsonb_build_object('success', true, 'message', 'Application rejected.');
  end if;

  return jsonb_build_object('success', false, 'message', 'Unknown review decision.');
end;
$$;

grant execute on function public.review_department_application(text, text) to authenticated;

-- Coordinators should NOT have arbitrary UPDATE access to applications. They
-- record outcomes through the RPC above.
drop policy if exists "Department coordinators approve applications" on "Application";
drop policy if exists "Department coordinators review internship approvals" on "Application";

-- ------------------------------------------------------------
-- 6. Storage hardening
-- ------------------------------------------------------------
-- Uploaded documents live under "documents/<userId>/...". Only the owner may
-- read/write files in their folder. Organisations and scoped Department
-- Coordinators may read documents that are referenced from the applications
-- they are authorised to see. Admins retain full access.
drop policy if exists "Authenticated users upload files" on storage.objects;
drop policy if exists "Authenticated users read uploads" on storage.objects;

create policy "Owners upload their files" on storage.objects
  for insert with check (
    bucket_id = 'uploads'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[array_length(storage.foldername(name), 1)] = auth.uid()::text
  );

create policy "Owners read their files" on storage.objects
  for select using (
    bucket_id = 'uploads'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[array_length(storage.foldername(name), 1)] = auth.uid()::text
  );

create policy "Admins read uploads" on storage.objects
  for select using (
    bucket_id = 'uploads'
    and public.get_my_role() = 'ADMIN'
  );

create policy "Recruiters read application documents" on storage.objects
  for select using (
    bucket_id = 'uploads'
    and exists (
      select 1
      from "Application" a
      join "Internship" i on i.id = a."internshipId"
      where (a."resumeUrl" = name or a."coverLetterUrl" = name)
        and i."recruiterId" = auth.uid()::text
        and a."departmentApprovalRequired" = false
    )
  );

create policy "Department coordinators read application documents" on storage.objects
  for select using (
    bucket_id = 'uploads'
    and public.get_my_role() = 'DEPARTMENT_COORDINATOR'
    and exists (
      select 1
      from "Application" a
      join "StudentInstitutionAffiliation" aff
        on aff."studentId" = a."studentId"
       and aff."isPrimary" = true
      where (a."resumeUrl" = name or a."coverLetterUrl" = name)
        and public.can_read_student_affiliation(
          aff."institutionId",
          aff."facultyId",
          aff."departmentId",
          a."studentId"
        )
    )
  );