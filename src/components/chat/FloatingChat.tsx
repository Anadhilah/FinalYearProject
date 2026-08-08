import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import type { ChatConversation } from "@/types/chat";
import { fetchConversations, sendConversationMessage } from "@/services/chat";
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

  if (!user || user.role === "admin") return null;

const handleSendMessage = async (conversationId: string, text: string): Promise<void> => {
    const message = await sendConversationMessage(conversationId, text);
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, messages: [...c.messages, message], lastActivity: message.timestamp }
          : c
      )
    );
    setSelectedConv((prev) =>
      prev && prev.id === conversationId
        ? { ...prev, messages: [...prev.messages, message], lastActivity: message.timestamp }
        : prev
    );
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