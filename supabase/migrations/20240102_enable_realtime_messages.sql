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

alter publication supabase_realtime add table public."Message";

-- Ensure the full row (including text/conversationId/senderId)
-- is available in the realtime payload.
alter table public."Message" replica identity full;
