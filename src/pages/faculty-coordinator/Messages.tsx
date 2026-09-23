import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages } from "@/contexts/MessagesContext";
import type { ChatConversation } from "@/types/chat";
import ConversationList from "@/components/chat/ConversationList";
import ChatWindow from "@/components/chat/ChatWindow";
import { MessageCircle } from "lucide-react";

export default function FacultyCoordinatorMessages() {
  const { user } = useAuth();
  const { conversations, loading, selectConversation, resetSelection, sendMessage } = useMessages();
  const [selected, setSelected] = useState<ChatConversation | null>(null);
  const [searchParams] = useSearchParams();

  const handleSelect = (conversation: ChatConversation) => {
    setSelected(conversation);
    selectConversation(conversation.id);
  };

  const handleBack = () => {
    setSelected(null);
    resetSelection();
  };

  useEffect(() => () => resetSelection(), [resetSelection]);

  useEffect(() => {
    const conversationId = searchParams.get("conversation");
    const conversation = conversationId ? conversations.find((item) => item.id === conversationId) : null;
    if (conversation) handleSelect(conversation);
  }, [conversations, searchParams]);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-display font-bold">Messages</h2>
        <p className="text-muted-foreground">Chat with students, department coordinators, and other participants in your real conversations.</p>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-card" style={{ height: "calc(100vh - 14rem)" }}>
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading conversations...</div>
        ) : conversations.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <MessageCircle className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <h3 className="font-display text-lg font-semibold">No conversations yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Messages will appear here when a student or coordinator contacts you.</p>
          </div>
        ) : (
          <div className="flex h-full">
            <div className={`w-full flex-shrink-0 border-r md:w-80 ${selected ? "hidden md:flex md:flex-col" : "flex flex-col"}`}>
              <ConversationList conversations={conversations} currentUserId={user?.id || ""} selectedId={selected?.id} onSelect={handleSelect} />
            </div>
            <div className={`flex-1 ${!selected ? "hidden md:flex" : "flex"} flex-col`}>
              {selected ? (
                <ChatWindow conversation={selected} currentUserId={user?.id || ""} onBack={handleBack} onSendMessage={sendMessage} />
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center text-center">
                  <MessageCircle className="mb-3 h-10 w-10 text-muted-foreground/20" />
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
