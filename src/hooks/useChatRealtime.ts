import { useEffect } from "react";
import { subscribeToMessages } from "@/services/chat";
import type { ChatConversation } from "@/types/chat";

/**
 * Subscribes to realtime message inserts and updates the conversations state
 * (and the currently selected conversation) in place. Incoming messages are
 * deduplicated by id so the sender does not see their own optimistically added
 * message twice.
 */
export function useChatRealtime(
  currentUserId: string | undefined,
  setConversations: React.Dispatch<React.SetStateAction<ChatConversation[]>>,
  setSelected: React.Dispatch<React.SetStateAction<ChatConversation | null>>
) {
  useEffect(() => {
    if (!currentUserId) return;

    const unsubscribe = subscribeToMessages(({ conversationId, message }) => {
      // Ignore messages the current user sent themselves (they are already
      // appended locally after sending).
      if (message.senderId === currentUserId) return;

      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id !== conversationId) return conv;
          // Prevent duplicates if the same message somehow arrives twice.
          if (conv.messages.some((m) => m.id === message.id)) return conv;
          return {
            ...conv,
            messages: [...conv.messages, message],
            lastActivity: message.timestamp,
          };
        })
      );

      setSelected((prev) => {
        if (!prev || prev.id !== conversationId) return prev;
        if (prev.messages.some((m) => m.id === message.id)) return prev;
        return {
          ...prev,
          messages: [...prev.messages, message],
          lastActivity: message.timestamp,
        };
      });
    });

    return unsubscribe;
  }, [currentUserId, setConversations, setSelected]);
}
