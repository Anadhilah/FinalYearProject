import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatConversation } from "@/types/chat";
import { useToast } from "@/hooks/use-toast";

interface ChatWindowProps {
  conversation: ChatConversation;
  currentUserId: string;
  onBack?: () => void;
  onSendMessage: (conversationId: string, text: string) => Promise<void>;
  compact?: boolean;
}

export default function ChatWindow({ conversation, currentUserId, onBack, onSendMessage, compact = false }: ChatWindowProps) {
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const otherParticipant = conversation.participants.find((p) => p.id !== currentUserId);

  useEffect(() => {
    const node = bottomRef.current;
    if (typeof node?.scrollIntoView === "function") {
      node.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation.messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    try {
      setSending(true);
      await onSendMessage(conversation.id, text);
    } catch (err) {
      toast({ title: "Message failed to send", description: "Please try again.", variant: "destructive" });
      setInput(text); // restore so the user doesn't lose what they typed
    } finally {
      setSending(false);
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      <div className={cn("flex flex-col min-h-0", compact ? "h-full" : "h-[calc(100vh-12rem)]")}>
        {/* Header */}
        <div className="flex items-center gap-3 p-3 border-b bg-card flex-shrink-0">
          {onBack && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
            {otherParticipant?.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{otherParticipant?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{otherParticipant?.role}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-3 bg-muted/20">
          {conversation.messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                  isMe
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-card border rounded-bl-md"
                )}>
                  <p>{msg.text}</p>
                  <p className={cn("text-[10px] mt-1", isMe ? "text-primary-foreground/60" : "text-muted-foreground")}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t bg-card flex gap-2 flex-shrink-0">
          <Input
            placeholder="Type a message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={sending}
            className="flex-1"
          />
          <Button size="icon" onClick={sendMessage} disabled={!input.trim() || sending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}