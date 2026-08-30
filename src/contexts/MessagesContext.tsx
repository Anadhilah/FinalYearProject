import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  fetchConversations,
  sendConversationMessage,
  buildOptimisticMessage,
  subscribeToMessages,
} from "@/services/chat";
import type { ChatConversation } from "@/types/chat";

interface MessagesContextValue {
  conversations: ChatConversation[];
  unreadCount: number;
  loading: boolean;
  openConversationId: string | null;
  setOpenConversationId: (conversationId: string | null) => void;
  markConversationSeen: (conversationId: string) => void;
  selectConversation: (conversationId: string) => void;
  resetSelection: () => void;
  sendMessage: (
    conversationId: string,
    text: string
  ) => Promise<void>;
  refresh: () => Promise<void>;
}

const MessagesContext = createContext<MessagesContextValue | null>(null);

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

export function MessagesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [openConversationId, setOpenConversationId] = useState<string | null>(null);

  // Message ids the user has seen. Persisted in memory for the session.
  const [seenMessageIds, setSeenMessageIds] = useState<Set<string>>(new Set());

  // Message ids that were present on initial load. Messages in this set are
  // treated as "already seen" so we never show stale toasts or unread counts
  // for messages that existed before the user opened the app.
  const initialIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  // Track whether a conversation is currently open via the Messages page.
  const openConversationIdRef = useRef<string | null>(null);
  openConversationIdRef.current = openConversationId;

  const currentUserId = user?.id;

  const fetchAndSet = useCallback(async () => {
    try {
      const data = await fetchConversations();
      setConversations((prev) => {
        const merged = data.map((incoming) => {
          const existing = prev.find((c) => c.id === incoming.id);
          if (!existing) return incoming;
          const byId = new Map<string, ChatConversation["messages"][number]>();
          existing.messages.forEach((m) => byId.set(m.id, m));
          incoming.messages.forEach((m) => byId.set(m.id, m));
          return {
            ...incoming,
            messages: incoming.messages.map(
              (m) => byId.get(m.id) ?? m
            ),
          };
        });
        return merged;
      });
      if (!initializedRef.current) {
        initializedRef.current = true;
        const ids = new Set<string>();
        data.forEach((conv) => conv.messages.forEach((m) => ids.add(m.id)));
        initialIdsRef.current = ids;
        setSeenMessageIds(ids);
      }
    } catch (err) {
      console.error("[messages] failed to load conversations", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + periodic safety-net polling.
  useEffect(() => {
    if (!currentUserId) return;
    fetchAndSet();
    const interval = setInterval(fetchAndSet, 3000);
    return () => clearInterval(interval);
  }, [currentUserId, fetchAndSet]);

  // Real-time subscription for incoming messages. Fires a toast for each new
  // incoming message once, and bumps the unread counter.
  useEffect(() => {
    if (!currentUserId) return;

    const unsubscribe = subscribeToMessages(({ conversationId, message }) => {
      // Ignore messages the current user sent themselves.
      if (message.senderId === currentUserId) return;

      // Ignore messages that arrived in an already-seen id (dedupe).
      const alreadySeen = seenMessageIds.has(message.id);
      const inOpenConversation = openConversationIdRef.current === conversationId;

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? mergeMessage(conv, message) : conv
        )
      );

      if (!alreadySeen && !inOpenConversation) {
        const conv = conversations.find((c) => c.id === conversationId);
        const sender = conv?.participants.find((p) => p.id === message.senderId);
        toast({
          title: "New message",
          description: `${sender?.name || "Someone"} sent you a message`,
          duration: 4000,
        });
      }
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  // When a conversation is opened, mark all of its messages as seen so the
  // unread counter drops and future toasts for that conversation fire.
  useEffect(() => {
    if (!openConversationId) return;
    setSeenMessageIds((prev) => {
      const updated = new Set(prev);
      const conv = conversations.find((c) => c.id === openConversationId);
      conv?.messages.forEach((m) => updated.add(m.id));
      return updated;
    });
  }, [openConversationId, conversations]);

  const markConversationSeen = useCallback((conversationId: string) => {
    setSeenMessageIds((prev) => {
      const updated = new Set(prev);
      const conv = conversations.find((c) => c.id === conversationId);
      conv?.messages.forEach((m) => updated.add(m.id));
      return updated;
    });
  }, [conversations]);

  const selectConversation = useCallback(
    (conversationId: string) => {
      setOpenConversationId(conversationId);
      markConversationSeen(conversationId);
    },
    [markConversationSeen]
  );

  const resetSelection = useCallback(() => {
    setOpenConversationId(null);
  }, []);

  const sendMessage = useCallback(
    async (conversationId: string, text: string): Promise<void> => {
      const optimistic = buildOptimisticMessage(currentUserId || "", text);
      const applyOptimistic = (prev: ChatConversation[]) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, messages: [...c.messages, optimistic], lastActivity: optimistic.timestamp }
            : c
        );
      setConversations(applyOptimistic);

      try {
        const message = await sendConversationMessage(conversationId, text);
        const swap = (prev: ChatConversation[]) =>
          prev.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === optimistic.id ? message : m
                  ),
                  lastActivity: message.timestamp,
                }
              : c
          );
        setConversations(swap);
      } catch (err) {
        const remove = (prev: ChatConversation[]) =>
          prev.map((c) =>
            c.id === conversationId
              ? { ...c, messages: c.messages.filter((m) => m.id !== optimistic.id) }
              : c
          );
        setConversations(remove);
        throw err;
      }
    },
    [currentUserId]
  );

  const unreadCount = useMemo(() => {
    return conversations.reduce((count, conv) => {
      return (
        count +
        conv.messages.filter((m) => !seenMessageIds.has(m.id)).length
      );
    }, 0);
  }, [conversations, seenMessageIds]);

  const value = useMemo<MessagesContextValue>(
    () => ({
      conversations,
      unreadCount,
      loading,
      openConversationId,
      setOpenConversationId,
      markConversationSeen,
      selectConversation,
      resetSelection,
      sendMessage,
      refresh: fetchAndSet,
    }),
    [
      conversations,
      unreadCount,
      loading,
      openConversationId,
      markConversationSeen,
      selectConversation,
      resetSelection,
      sendMessage,
      fetchAndSet,
    ]
  );

  return (
    <MessagesContext.Provider value={value}>
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessages(): MessagesContextValue {
  const ctx = useContext(MessagesContext);
  if (!ctx) {
    throw new Error("useMessages must be used within a MessagesProvider");
  }
  return ctx;
}
