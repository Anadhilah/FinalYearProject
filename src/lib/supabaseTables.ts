/**
 * Central configuration for Supabase table names and storage buckets.
 * Adjust these to match your Supabase schema in one place.
 */
export const TABLES = {
  USER: "User",
  INTERNSHIP: "Internship",
  APPLICATION: "Application",
  LOGBOOK_REPORT: "LogbookReport",
  CONVERSATION: "Conversation",
  CONVERSATION_PARTICIPANT: "ConversationParticipant",
  MESSAGE: "Message",
  MEETING: "Meeting",
} as const;

export const STORAGE = {
  BUCKET: "uploads",
  /** Prefix (folder) where uploaded documents are stored. */
  FOLDER: "documents",
} as const;

/** Supabase Edge Function that issues Agora tokens. */
export const AGORA_EDGE_FUNCTION = "agora-token";
