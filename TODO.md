# TODO: Real-time Messaging Fix

## Goal
Make messages appear instantly for the receiver without requiring a page refresh by adding Supabase realtime subscriptions.

## Steps
- [x] 1. Explore the messaging codebase (services, components, pages, schema)
- [x] 2. Create the implementation plan and get approval
- [x] 3. Add `subscribeToMessages` helper in `src/services/chat.ts`
- [x] 4. Create Supabase migration to enable realtime on the `Message` table
- [x] 5. Wire realtime subscription into `src/pages/student/Messages.tsx`
- [x] 6. Wire realtime subscription into `src/pages/recruiter/Messages.tsx`
- [x] 7. Wire realtime subscription into `src/components/chat/FloatingChat.tsx`
- [x] 8. Verify TypeScript compiles (`npx tsc --noEmit`)
- [x] 9. Update this TODO file to mark completed steps

