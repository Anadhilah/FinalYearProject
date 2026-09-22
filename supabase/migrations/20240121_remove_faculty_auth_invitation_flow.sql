-- Remove the abandoned Faculty Coordinator Auth invitation flow.
-- The shared CoordinatorInvitation table remains for unrelated legacy flows.

drop function if exists public.activate_faculty_coordinator_account(text);
drop function if exists public.create_faculty_coordinator_invitation(text, text, text, text, timestamptz);

drop policy if exists "Department coordinators create faculty invitations" on "CoordinatorInvitation";
drop policy if exists "Department coordinators read own faculty invitations" on "CoordinatorInvitation";

alter table "CoordinatorInvitation"
  drop column if exists "staffId";