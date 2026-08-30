export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface ChatParticipant {
  id: string;
  name: string;
  role: "student" | "recruiter" | "admin" | "supervisor";
  avatar?: string;
}

export interface ChatConversation {
  id: string;
  participants: ChatParticipant[];
  messages: ChatMessage[];
  lastActivity: string;
}
