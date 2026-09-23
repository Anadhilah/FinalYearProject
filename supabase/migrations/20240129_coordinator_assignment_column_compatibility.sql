-- Keep coordinator assignment writes compatible with the legacy schema,
-- which requires coordinatorUserId, and the newer coordinatorId column.

alter table "CoordinatorAssignment"
  add column if not exists "coordinatorUserId" text;

update "CoordinatorAssignment"
set "coordinatorUserId" = "coordinatorId"
where "coordinatorUserId" is null
  and "coordinatorId" is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'CoordinatorAssignment_coordinatorUserId_fkey'
      and conrelid = '"CoordinatorAssignment"'::regclass
  ) then
    alter table "CoordinatorAssignment"
      add constraint "CoordinatorAssignment_coordinatorUserId_fkey"
      foreign key ("coordinatorUserId") references "User" (id) on delete cascade;
  end if;
end $$;
