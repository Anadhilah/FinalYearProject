import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import type { ChatConversation } from "@/types/chat";
import { fetchConversations, sendConversationMessage, buildOptimisticMessage } from "@/services/chat";
import { useChatRealtime } from "@/hooks/useChatRealtime";
import ConversationList from "./ConversationList";
import ChatWindow from "./ChatWindow";

export default function FloatingChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<ChatConversation | null>(null);

useEffect(() => {
    if (!user || user.role === "admin") return;
    fetchConversations()
      .then(setConversations)
      .catch((err) => console.error("Failed to load conversations:", err));
  }, [user]);

  useChatRealtime(user?.id, setConversations, setSelectedConv);

  if (!user || user.role === "admin") return null;

const handleSendMessage = async (conversationId: string, text: string): Promise<void> => {
    const optimistic = buildOptimisticMessage(user.id, text);
    const applyOptimistic = (prev: ChatConversation[]) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, messages: [...c.messages, optimistic], lastActivity: optimistic.timestamp }
          : c
      );
    setConversations(applyOptimistic);
    setSelectedConv((prev) =>
      prev && prev.id === conversationId
        ? { ...prev, messages: [...prev.messages, optimistic], lastActivity: optimistic.timestamp }
        : prev
    );

    try {
      const message = await sendConversationMessage(conversationId, text);
      const swap = (prev: ChatConversation[]) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                messages: c.messages.map((m) => (m.id === optimistic.id ? message : m)),
                lastActivity: message.timestamp,
              }
            : c
        );
      setConversations(swap);
      setSelectedConv((prev) =>
        prev && prev.id === conversationId
          ? { ...prev, messages: prev.messages.map((m) => (m.id === optimistic.id ? message : m)), lastActivity: message.timestamp }
          : prev
      );
    } catch (err) {
      const remove = (prev: ChatConversation[]) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, messages: c.messages.filter((m) => m.id !== optimistic.id) }
            : c
        );
      setConversations(remove);
      setSelectedConv((prev) =>
        prev && prev.id === conversationId
          ? { ...prev, messages: prev.messages.filter((m) => m.id !== optimistic.id) }
          : prev
      );
      throw err;
    }
  };

  const unreadCount = conversations.length;

  return (
    <>
      <Button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-elevated",
          "gradient-hero hover:opacity-90 transition-all"
        )}
        size="icon"
      >
        {open ? <X className="h-5 w-5 text-primary-foreground" /> : (
          <div className="relative">
            <MessageCircle className="h-5 w-5 text-primary-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-accent text-[9px] font-bold text-accent-foreground flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
        )}
      </Button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] h-[500px] rounded-2xl border bg-card shadow-elevated overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          {selectedConv ? (
            <ChatWindow
              conversation={selectedConv}
              currentUserId={user.id}
              onBack={() => setSelectedConv(null)}
              onSendMessage={handleSendMessage}
              compact
            />
          ) : (
            <ConversationList
              conversations={conversations}
              currentUserId={user.id}
              onSelect={setSelectedConv}
              compact
            />
          )}
        </div>
      )}
    </>
  );
}