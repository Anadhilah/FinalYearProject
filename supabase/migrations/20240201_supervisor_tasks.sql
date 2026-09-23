-- Persist tasks assigned by company supervisors to their interns.

create table if not exists "SupervisorTask" (
  id text primary key,
  title text not null,
  "studentId" text not null references "User" (id) on delete cascade,
  "supervisorId" text not null references "User" (id) on delete cascade,
  "internshipId" text not null references "Internship" (id) on delete cascade,
  "dueDate" date,
  priority text not null default 'NORMAL',
  status text not null default 'PENDING',
  "studentUpdate" text,
  "studentUpdatedAt" timestamptz,
  "completedAt" timestamptz,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);
alter table "SupervisorTask"
  add column if not exists priority text not null default 'NORMAL',
  add column if not exists "studentUpdate" text,
  add column if not exists "studentUpdatedAt" timestamptz;
alter table "SupervisorTask" enable row level security;

grant select, insert, update, delete on table "SupervisorTask" to authenticated;

drop policy if exists "Supervisors manage assigned tasks" on "SupervisorTask";
create policy "Supervisors manage assigned tasks" on "SupervisorTask"
  for all to authenticated
  using (public.get_my_role() = 'SUPERVISOR' and "supervisorId" = auth.uid()::text)
  with check (
    public.get_my_role() = 'SUPERVISOR'
    and "supervisorId" = auth.uid()::text
    and exists (select 1 from "Internship" i where i.id = "SupervisorTask"."internshipId" and i."supervisorId" = auth.uid()::text)
  );

drop policy if exists "Students read assigned tasks" on "SupervisorTask";
create policy "Students read assigned tasks" on "SupervisorTask"
  for select to authenticated using ("studentId" = auth.uid()::text);

drop policy if exists "Students update assigned tasks" on "SupervisorTask";
create policy "Students update assigned tasks" on "SupervisorTask"
  for update to authenticated
  using ("studentId" = auth.uid()::text)
  with check ("studentId" = auth.uid()::text);