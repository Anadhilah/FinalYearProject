import { useEffect } from "react";
import { subscribeToMessages, fetchConversations } from "@/services/chat";
import type { ChatConversation } from "@/types/chat";

/**
 * Merges an incoming message into a conversation in place, deduping by id so
 * neither the sender's optimistic message nor a duplicate realtime event is
 * shown twice.
 */
function mergeMessage(
  conv: ChatConversation,
  message: ChatConversation["messages"][number]
): ChatConversation {
  if (conv.messages.some((m) => m.id === message.id)) return conv;
  return {
    ...conv,
    messages: [...conv.messages, message],
    lastActivity:
      message.timestamp > conv.lastActivity
        ? message.timestamp
        : conv.lastActivity,
  };
}

/**
 * Reconciles the fetched conversations into state, preserving the currently
 * open conversation and refreshing both the list and the selected conversation.
 */
function reconcile(
  setConversations: React.Dispatch<React.SetStateAction<ChatConversation[]>>,
  setSelected: React.Dispatch<React.SetStateAction<ChatConversation | null>>,
  data: ChatConversation[]
) {
  setConversations(data);
  setSelected((prev) => {
    if (!prev) return prev;
    return data.find((c) => c.id === prev.id) ?? prev;
  });
}

/**
 * Subscribes to realtime message inserts AND polls as a safety net. The
 * polling guarantees messages appear automatically (no manual refresh) even
 * if realtime delivery is delayed or the realtime publication hasn't been
 * configured yet.
 */
export function useChatRealtime(
  currentUserId: string | undefined,
  setConversations: React.Dispatch<React.SetStateAction<ChatConversation[]>>,
  setSelected: React.Dispatch<React.SetStateAction<ChatConversation | null>>
) {
  useEffect(() => {
    if (!currentUserId) return;

    // Fast path: realtime inserts.
    const unsubscribe = subscribeToMessages(({ conversationId, message }) => {
      // Ignore messages the current user sent themselves (they are already
      // appended locally after sending).
      if (message.senderId === currentUserId) return;

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? mergeMessage(conv, message) : conv
        )
      );

      setSelected((prev) => {
        if (!prev || prev.id !== conversationId) return prev;
        return mergeMessage(prev, message);
      });
    });

// Safety-net fallback: periodically refetch all conversations so new
    // messages appear even if a realtime event was missed or not configured.
    // Polling every 3s keeps the fallback near-instant.
    const interval = setInterval(async () => {
      try {
        const data = await fetchConversations();
        reconcile(setConversations, setSelected, data);
      } catch (err) {
        console.error("[chat] poll fallback failed", err);
      }
    }, 3000);

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);
}
