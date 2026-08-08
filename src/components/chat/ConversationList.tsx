import { cn } from "@/lib/utils";
import type { ChatConversation } from "@/types/chat";

interface ConversationListProps {
  conversations: ChatConversation[];
  currentUserId: string;
  selectedId?: string;
  onSelect: (conv: ChatConversation) => void;
  compact?: boolean;
}

export default function ConversationList({ conversations, currentUserId, selectedId, onSelect, compact = false }: ConversationListProps) {
  const formatDate = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className={cn("flex flex-col", compact ? "h-full" : "")}>
      <div className="p-3 border-b">
        <h3 className="font-display font-semibold text-sm">Messages</h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conv) => {
          const other = conv.participants.find((p) => p.id !== currentUserId);
          const lastMsg = conv.messages[conv.messages.length - 1];
          const active = selectedId === conv.id;

          return (
            <button
              key={conv.id}
              onClick={() => onSelect(conv)}
              className={cn(
                "w-full flex items-start gap-3 p-3 text-left transition-colors hover:bg-muted/50 border-b border-border/50",
                active && "bg-primary/5 border-l-2 border-l-primary"
              )}
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-sm font-semibold text-primary">
                {other?.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">{other?.name}</p>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">{formatDate(conv.lastActivity)}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{lastMsg?.text}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
