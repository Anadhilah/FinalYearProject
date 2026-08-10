import { supabase } from "@/lib/supabaseClient";
import { TABLES } from "@/lib/supabaseTables";
import type { ChatConversation, ChatMessage, ChatParticipant } from "@/types/chat";

function throwIfError(error: { message?: string } | null, fallback: string) {
  if (error) throw new Error(error.message || fallback);
}

/**
 * The tables use `id text primary key` with NO default value, so the app must
 * supply an id on insert. This returns a unique id for new rows.
 */
function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

interface ConversationRow {
  id: string;
  lastActivity: string | null;
  createdAt: string | null;
}

interface ParticipantRow {
  id: string;
  name: string | null;
  role: string | null;
  email: string | null;
}

/** Loads the participants for a conversation from the join table. */
async function fetchParticipants(conversationId: string): Promise<ChatParticipant[]> {
  const { data, error } = await supabase
    .from(TABLES.CONVERSATION_PARTICIPANT)
    .select("userId, user:userId(id, name, role, email)")
    .eq("conversationId", conversationId);

  if (error) throw new Error(error.message || "Failed to load participants");

  const participants: ChatParticipant[] = (data || [])
    .map((row) => {
      const raw = row.user as ParticipantRow | ParticipantRow[] | null;
      const u = Array.isArray(raw) ? raw[0] : (raw ?? null);
      if (!u) return null;
      return {
        id: u.id,
        name: u.name || u.email || "User",
        role: (u.role || "student").toLowerCase() as ChatParticipant["role"],
      };
    })
    .filter((p): p is ChatParticipant => p !== null);

  return participants;
}

/** Loads the messages for a conversation. */
async function fetchMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from(TABLES.MESSAGE)
    .select("*")
    .eq("conversationId", conversationId)
    .order("createdAt", { ascending: true });

  if (error) throw new Error(error.message || "Failed to load messages");

  return (data || []).map((m) => ({
    id: m.id,
    senderId: m.senderId,
    text: m.text,
    timestamp: m.createdAt || m.updatedAt || new Date().toISOString(),
  }));
}

/** Builds a ChatConversation from a raw conversation row. */
async function buildConversation(row: ConversationRow): Promise<ChatConversation> {
  const [participants, messages] = await Promise.all([
    fetchParticipants(row.id),
    fetchMessages(row.id),
  ]);

  return {
    id: row.id,
    participants,
    messages,
    lastActivity: row.lastActivity || row.createdAt || new Date().toISOString(),
  };
}

export interface ConversationResponse {
  conversations: ChatConversation[];
}

export interface MessageResponse {
  message: ChatMessage;
}

/** Fetches all conversations that the current user participates in. */
export const fetchConversations = async (): Promise<ChatConversation[]> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) throw new Error("You must be signed in.");

  // Find the conversation ids the current user is a participant of.
  const { data: memberships, error: membershipError } = await supabase
    .from(TABLES.CONVERSATION_PARTICIPANT)
    .select("conversationId")
    .eq("userId", user.user.id);

  if (membershipError) throw new Error(membershipError.message || "Failed to load conversations");

  const conversationIds = (memberships || []).map((m) => m.conversationId);
  if (conversationIds.length === 0) return [];

  const { data, error } = await supabase
    .from(TABLES.CONVERSATION)
    .select("*")
    .in("id", conversationIds)
    .order("lastActivity", { ascending: false });

  if (error) throw new Error(error.message || "Failed to load conversations");

  const rows = (data || []) as ConversationRow[];
  const conversations = await Promise.all(rows.map((row) => buildConversation(row)));
  return conversations;
};

export interface RealtimeMessage {
  conversationId: string;
  message: ChatMessage;
}

/**
 * Builds a temporary "optimistic" message so the sender sees their message
 * instantly, before the DB insert completes. It is replaced by the real row
 * once `sendConversationMessage` resolves. The temp id is prefixed with
 * "temp_" so callers can find and swap it out.
 */
export const buildOptimisticMessage = (
  senderId: string,
  text: string
): ChatMessage => ({
  id: `temp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`,
  senderId,
  text,
  timestamp: new Date().toISOString(),
});

/**
 * Fetches just the messages for a single conversation. Used as a lightweight
 * polling fallback so messages appear automatically even if realtime delivery
 * is delayed or the migration hasn't been applied yet.
 */
export const fetchMessagesForConversation = async (
  conversationId: string
): Promise<ChatMessage[]> => {
  return fetchMessages(conversationId);
};

/**
 * Subscribes to realtime inserts on the Message table. Because RLS is enabled
 * on the Message table, Supabase realtime only delivers inserts for messages
 * the current user is permitted to read (i.e. messages in conversations the
 * user is a participant of). Returns an unsubscribe function.
 *
 * Each call uses a unique channel name so multiple subscribers (e.g. the
 * global FloatingChat and the Messages pages) don't share/tear down each
 * other's channels. A status callback is exposed so callers can detect when
 * the subscription fails (e.g. the table isn't in the realtime publication).
 */
export const subscribeToMessages = (
  onMessage: (payload: RealtimeMessage) => void,
  onStatus?: (status: "SUBSCRIBED" | "CHANNEL_ERROR" | "TIMED_OUT") => void
): (() => void) => {
  const channelName = `messages-realtime-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: TABLES.MESSAGE },
      (payload) => {
        const row = payload.new as Record<string, unknown> | null;
        if (!row) return;
        const message: ChatMessage = {
          id: String(row.id),
          senderId: String(row.senderId),
          text: String(row.text),
          timestamp: (row.createdAt as string) || new Date().toISOString(),
        };
        onMessage({ conversationId: String(row.conversationId), message });
      }
    )
    .subscribe((status, err) => {
      if (status === "SUBSCRIBED") {
        onStatus?.("SUBSCRIBED");
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.error("[realtime] message channel error", status, err);
        onStatus?.(status);
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
};

/** Sends a message in a conversation. */
export const sendConversationMessage = async (conversationId: string, text: string): Promise<ChatMessage> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) throw new Error("You must be signed in.");

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from(TABLES.MESSAGE)
.insert({ id: newId(), conversationId, senderId: user.user.id, text, createdAt: now })
    .select()
    .single();

  if (error) throw new Error(error.message || "Failed to send message");

  await supabase
    .from(TABLES.CONVERSATION)
    .update({ lastActivity: now })
    .eq("id", conversationId);

  return {
    id: data.id,
    senderId: data.senderId,
    text: data.text,
    timestamp: data.createdAt || now,
  };
};

/** Starts (or returns) a conversation between the current user and another user. */
export const startConversation = async (otherUserId: string): Promise<ChatConversation> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user?.id) throw new Error("You must be signed in.");

  // Fetch each user's conversation ids.
  const { data: myMemberships } = await supabase
    .from(TABLES.CONVERSATION_PARTICIPANT)
    .select("conversationId")
    .eq("userId", user.user.id);

  const { data: otherMemberships } = await supabase
    .from(TABLES.CONVERSATION_PARTICIPANT)
    .select("conversationId")
    .eq("userId", otherUserId);

  const myIds = new Set((myMemberships || []).map((m) => m.conversationId));
  const existingId = (otherMemberships || []).find((m) => myIds.has(m.conversationId))?.conversationId;

  if (existingId) {
    const { data: row, error: rowError } = await supabase
      .from(TABLES.CONVERSATION)
      .select("*")
      .eq("id", existingId)
      .single();
    if (rowError) throw new Error(rowError.message || "Failed to load conversation");
    return buildConversation(row as ConversationRow);
  }

  // No shared conversation yet — create one with both participants.
  const { data: conversation, error: conversationError } = await supabase
    .from(TABLES.CONVERSATION)
.insert({ id: newId(), lastActivity: new Date().toISOString() })
    .select()
    .single();

  if (conversationError) throw new Error(conversationError.message || "Failed to start conversation");

  const { error: participantError } = await supabase
    .from(TABLES.CONVERSATION_PARTICIPANT)
    .insert([
      { id: newId(), conversationId: conversation.id, userId: user.user.id },
      { id: newId(), conversationId: conversation.id, userId: otherUserId },
    ]);

  if (participantError) throw new Error(participantError.message || "Failed to start conversation");

  return buildConversation(conversation as ConversationRow);
};
