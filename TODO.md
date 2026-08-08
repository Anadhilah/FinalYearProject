# TODO — Fix Admin ManageInternships crash

## ✅ Step 1: Make `admin/ManageInternships.tsx` resilient (DONE)
- [x] Make `_count` optional in the `Internship` interface
- [x] Use `item._count?.applications ?? 0` in the table body
- [x] Use `String(selected._count?.applications ?? 0)` in the detail dialog
- [x] Guard `setInternships` with `Array.isArray`

## ✅ Step 2: Populate real application count in `supabase-api.ts` (DONE)
- [x] Enhance `fetchInternships()` to compute `_count.applications` per internship

