-- ============================================================
-- InternshipConnect — Enable Realtime for Messages
-- ============================================================
-- Run this in the Supabase SQL editor.
--
-- This enables Postgres Realtime (postgres_changes) on the
-- "Message" table so that when a new message is inserted it is
-- broadcast to subscribed clients immediately. Combined with the
-- existing RLS policy ("Participants read messages"), realtime
-- will only deliver messages to the participants of the
-- conversation — other users will not receive them.
--
-- The "replica identity full" is required so the realtime
-- payload includes the full old + new row (needed for the
-- INSERT event to carry the column values the client reads).
-- ============================================================

-- ============================================================
-- Idempotent: only add the table if it isn't already a member.
-- Fixes ERROR 42710: relation "Message" is already member of
-- publication "supabase_realtime" when re-run.
-- ============================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'Message'
  ) then
    alter publication supabase_realtime add table public."Message";
  end if;
end
$$;

-- Ensure the full row (including text/conversationId/senderId)
-- is available in the realtime payload. (Idempotent — safe to re-run.)
alter table public."Message" replica identity full;

-- ============================================================
-- VERIFICATION (run after applying the statements above)
-- ============================================================
-- 1) Confirm the Message table is in the realtime publication:
--
--    select * from pg_publication_tables
--    where pubname = 'supabase_realtime' and schemaname = 'public';
--
--    You should see a row with tablename = 'Message'.
--
-- 2) Confirm replica identity is "full":
--
--    select relreplident from pg_class
--    where relname = 'Message';
--
--    relreplident should be 'f' (full).
--
-- If the table is NOT in the publication (e.g. this migration was never
-- applied), realtime subscribers connect but receive no INSERT events — that
-- is why messages only appear after a refresh. Re-run the two ALTER statements
-- above (they are idempotent) or run `supabase db push`.
-- ============================================================
