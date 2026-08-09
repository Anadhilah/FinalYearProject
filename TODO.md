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

## Follow-up: Agora edge function (CORS)
- [x] Replaced custom byte-builder (invalid "006" format) with official `agora-access-token` (AccessToken2 "007")
- [x] Verified `RtcTokenBuilder.buildTokenWithUid` + `RtcRole.PUBLISHER` generate a valid token
- [x] Kept correct CORS headers
- [ ] Deploy the function in Supabase dashboard + add Agora secrets

## Follow-up: Netlify build failure (ENOENT package.json)
- Root cause: git repo root = `internship-connect-ui` itself, but Netlify base directory was set to
  `internship-connect-ui`, doubling the path to `internship-connect-ui/internship-connect-ui/package.json`
- [x] Added `netlify.toml` at repo root (command = `npm run build`, publish = `dist`, no base dir)
- [x] Verified `npm run build` passes locally (dist generated)
- [ ] Action: In Netlify dashboard, clear the Base directory field (dashboard value overrides netlify.toml)
