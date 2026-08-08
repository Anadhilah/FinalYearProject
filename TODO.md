# Login Fix — TODO

## Goal
Make student login succeed even when the `User` profile row is missing and the
`ensure_user_profile` RPC is unavailable (404).

## Steps
- [x] Analyze root cause (406 = missing profile row; 404 = RPC missing)
- [x] Harden `fetchProfile` to treat 406 (and PGRST116) as "missing row" → returns null
- [x] Add a direct-insert fallback in `loadUser` self-heal when the RPC fails
- [x] Verify build/typecheck passes (tsc --noEmit exit 0)
- [x] (Outside scope) Ensure `supabase/schema.sql` is applied in the Supabase SQL editor

## Follow-up: Application insert 400
- [x] Add explicit `createdAt`/`updatedAt` to the `Application` insert in `createApplication` (handles NOT NULL constraint / missing DB defaults)
- [x] Root cause: `ApplicationStatus` enum uses UPPERCASE values (PENDING, ACCEPTED, REJECTED, REVIEWING) in the DB; the app was sending lowercase `"pending"` → 22P02 invalid enum value
- [x] Fix `createApplication` to send `status: "PENDING"` 
- [x] Fix `updateApplicationStatus` to uppercase the status via `normalizeApplicationStatus`
- [x] Surfaced the real PostgREST error in the toast/console for easier debugging
- [x] Verify typecheck passes (tsc --noEmit exit 0)
