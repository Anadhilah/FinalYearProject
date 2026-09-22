-- Track accounts that must replace a temporary password after first login.

alter table "User"
  add column if not exists "mustChangePassword" boolean not null default false;
