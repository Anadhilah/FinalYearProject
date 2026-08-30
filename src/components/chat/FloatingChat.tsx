import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages } from "@/contexts/MessagesContext";
import type { ChatConversation } from "@/types/chat";
import ConversationList from "./ConversationList";
import ChatWindow from "./ChatWindow";

export default function FloatingChat() {
  const { user } = useAuth();
  const { conversations, unreadCount, selectConversation, resetSelection, sendMessage } = useMessages();
  const [open, setOpen] = useState(false);
  const [internalSelected, setInternalSelected] = useState<ChatConversation | null>(null);

  if (!user || user.role === "admin") return null;

  const handleSelect = (conv: ChatConversation) => {
    setInternalSelected(conv);
    selectConversation(conv.id);
  };

  const handleBack = () => {
    setInternalSelected(null);
  };

  return (
    <>
      <Button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-elevated",
          "gradient-hero hover:opacity-90 transition-all"
        )}
        size="icon"
        aria-label="Chat"
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
          {internalSelected ? (
            <ChatWindow
              conversation={internalSelected}
              currentUserId={user.id}
              onBack={handleBack}
              onSendMessage={sendMessage}
              compact
            />
          ) : (
            <ConversationList
              conversations={conversations}
              currentUserId={user.id}
              onSelect={handleSelect}
              compact
            />
          )}
        </div>
      )}
    </>
  );
}
