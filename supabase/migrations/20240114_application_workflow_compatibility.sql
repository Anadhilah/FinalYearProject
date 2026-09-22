-- Add the application fields used by the student application form.
-- Safe to run after the base schema, even when earlier workflow migrations
-- were not applied.

do $$ begin
  create type "DepartmentReviewStatus" as enum ('NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED');
exception when duplicate_object then null; end $$;

alter table "Application"
  add column if not exists "coverLetterUrl" text,
  add column if not exists "departmentApprovalRequired" boolean not null default false,
  add column if not exists "coordinatorSupportRequested" boolean not null default false,
  add column if not exists "departmentReviewStatus" "DepartmentReviewStatus" not null default 'NOT_REQUIRED',
  add column if not exists "skills" text[] not null default '{}'::text[],
  add column if not exists "startDate" date,
  add column if not exists "endDate" date,
  add column if not exists "questionAnswers" jsonb not null default '[]'::jsonb,
  add column if not exists "departmentCoordinatorId" text references "User" (id) on delete set null;

grant select, insert on table "Application" to authenticated;