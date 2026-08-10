import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { ChatConversation } from "@/types/chat";
import { fetchConversations, sendConversationMessage, buildOptimisticMessage } from "@/services/chat";
import { useChatRealtime } from "@/hooks/useChatRealtime";
import ConversationList from "@/components/chat/ConversationList";
import ChatWindow from "@/components/chat/ChatWindow";
import { MessageCircle } from "lucide-react";

export default function StudentMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selected, setSelected] = useState<ChatConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConversations = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);

      try {
        const data = await fetchConversations();
        setConversations(data);
        setSelected((prev) => {
          if (!prev) return null;
          return data.find((conversation) => conversation.id === prev.id) ?? null;
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load conversations");
      } finally {
        setLoading(false);
      }
    };

loadConversations();
  }, [user]);

  useChatRealtime(user?.id, setConversations, setSelected);

const handleSendMessage = async (conversationId: string, text: string): Promise<void> => {
    if (!user) return;
    // Optimistic: show the sender's message instantly.
    const optimistic = buildOptimisticMessage(user.id, text);
    const applyOptimistic = (prev: ChatConversation[]) =>
      prev.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              messages: [...conversation.messages, optimistic],
              lastActivity: optimistic.timestamp,
            }
          : conversation
      );
    setConversations(applyOptimistic);
    setSelected((prev) =>
      prev && prev.id === conversationId
        ? { ...prev, messages: [...prev.messages, optimistic], lastActivity: optimistic.timestamp }
        : prev
    );

    try {
      const message = await sendConversationMessage(conversationId, text);
      // Swap the temp message for the real one.
      const swap = (prev: ChatConversation[]) =>
        prev.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                messages: conversation.messages.map((m) =>
                  m.id === optimistic.id ? message : m
                ),
                lastActivity: message.timestamp,
              }
            : conversation
        );
      setConversations(swap);
      setSelected((prev) =>
        prev && prev.id === conversationId
          ? { ...prev, messages: prev.messages.map((m) => (m.id === optimistic.id ? message : m)), lastActivity: message.timestamp }
          : prev
      );
    } catch (err) {
      // On failure, remove the optimistic message so we don't show a ghost.
      const remove = (prev: ChatConversation[]) =>
        prev.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, messages: conversation.messages.filter((m) => m.id !== optimistic.id) }
            : conversation
        );
      setConversations(remove);
      setSelected((prev) =>
        prev && prev.id === conversationId
          ? { ...prev, messages: prev.messages.filter((m) => m.id !== optimistic.id) }
          : prev
      );
      throw err;
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-display font-bold">Messages</h2>
        <p className="text-muted-foreground">Chat with recruiters about internship opportunities.</p>
      </div>

      <div className="border rounded-xl bg-card shadow-card overflow-hidden" style={{ height: "calc(100vh - 14rem)" }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <p className="text-sm text-muted-foreground">Loading conversations…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <MessageCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-display font-semibold text-lg">No messages yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              When recruiters reach out about your applications, conversations will appear here.
            </p>
          </div>
        ) : (
          <div className="flex h-full">
            <div className={`w-full md:w-80 border-r flex-shrink-0 ${selected ? "hidden md:flex md:flex-col" : "flex flex-col"}`}>
              <ConversationList
                conversations={conversations}
                currentUserId={user?.id || ""}
                selectedId={selected?.id}
                onSelect={setSelected}
              />
            </div>
            <div className={`flex-1 ${!selected ? "hidden md:flex" : "flex"} flex-col`}>
              {selected ? (
                <ChatWindow
                  conversation={selected}
                  currentUserId={user?.id || ""}
                  onBack={() => setSelected(null)}
                  onSendMessage={handleSendMessage}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <MessageCircle className="h-10 w-10 text-muted-foreground/20 mb-3" />
                  <p className="text-sm text-muted-foreground">Select a conversation to start chatting</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}