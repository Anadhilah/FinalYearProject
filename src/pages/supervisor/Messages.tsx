import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages } from "@/contexts/MessagesContext";
import type { ChatConversation } from "@/types/chat";
import ConversationList from "@/components/chat/ConversationList";
import ChatWindow from "@/components/chat/ChatWindow";
import { MessageCircle } from "lucide-react";

export default function SupervisorMessages() {
  const { user } = useAuth();
  const {
    conversations,
    loading,
    selectConversation,
    resetSelection,
    sendMessage,
  } = useMessages();
  const [selected, setSelected] = useState<ChatConversation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  const handleSelect = (conv: ChatConversation) => {
    setSelected(conv);
    selectConversation(conv.id);
  };

  const handleBack = () => {
    setSelected(null);
    resetSelection();
  };

  useEffect(() => {
    return () => resetSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const conversationId = searchParams.get("conversation");
    const conversation = conversationId ? conversations.find((item) => item.id === conversationId) : null;
    if (conversation) handleSelect(conversation);
  }, [conversations, searchParams]);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-display font-bold">Messages</h2>
        <p className="text-muted-foreground">Chat with your supervised students and recruiters.</p>
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
            <h3 className="font-display font-semibold text-lg">No conversations yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              You don’t have chat conversations yet.
            </p>
          </div>
        ) : (
          <div className="flex h-full">
            <div className={`w-full md:w-80 border-r flex-shrink-0 ${selected ? "hidden md:flex md:flex-col" : "flex flex-col"}`}>
              <ConversationList
                conversations={conversations}
                currentUserId={user?.id || ""}
                selectedId={selected?.id}
                onSelect={handleSelect}
              />
            </div>
            <div className={`flex-1 ${!selected ? "hidden md:flex" : "flex"} flex-col`}>
              {selected ? (
                <ChatWindow
                  conversation={selected}
                  currentUserId={user?.id || ""}
                  onBack={handleBack}
                  onSendMessage={sendMessage}
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
