-- Student onboarding profile fields.

alter table "User"
  add column if not exists phone text,
  add column if not exists "graduationYear" integer;