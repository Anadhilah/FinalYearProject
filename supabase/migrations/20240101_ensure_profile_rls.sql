-- ============================================================
-- InternshipConnect — ensure_user_profile (SECURITY DEFINER)
-- ============================================================
-- The app logs users in by reading their role from the "User" table, and
-- creates rows in child tables (e.g. "Application") that have a foreign key
-- back to "User". If a user's profile row is missing (e.g. the signup
-- trigger didn't run, or RLS blocked the insert), logins fail / child inserts
-- fail with a foreign-key violation (23503).
--
-- This SECURITY DEFINER function creates (or updates) the profile row
-- bypassing RLS, so the app can reliably ensure the row exists.
-- Run this in the Supabase SQL editor.
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
  v_status "RecruiterStatus";
  v_result jsonb;
begin
  v_role := p_role::"Role";
  if p_recruiter_status is not null and p_recruiter_status <> '' then
    v_status := p_recruiter_status::"RecruiterStatus";
  end if;

  insert into "User" (
    id, email, name, role, "isApproved", "emailVerified",
    "recruiterStatus", company, industry, "registrationNumber", "proofDocUrl",
    "createdAt", "updatedAt"
  ) values (
    p_id, p_email, coalesce(p_name, ''), v_role, coalesce(p_is_approved, false),
    coalesce(p_email_verified, false), v_status, p_company, p_industry,
    p_registration_number, p_proof_doc_url, now(), now()
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

-- Allow the anon/authenticated roles to call it (they are the app's roles).
grant execute on function public.ensure_user_profile(text, text, text, text, boolean, boolean, text, text, text, text, text) to anon, authenticated;

-- ============================================================
-- Also ensure the handle_new_user trigger exists (auto-create on signup)
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
