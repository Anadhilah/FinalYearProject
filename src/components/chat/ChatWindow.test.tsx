import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ChatWindow from "./ChatWindow";
import type { ChatConversation } from "@/types/chat";

describe("ChatWindow", () => {
  it("sends a message through the provided handler and displays the returned message", async () => {
    const conversation: ChatConversation = {
      id: "conv-1",
      lastActivity: new Date().toISOString(),
      participants: [
        { id: "user-1", name: "You", role: "student" },
        { id: "user-2", name: "Recruiter", role: "recruiter" },
      ],
      messages: [],
    };

    const onSendMessage = vi.fn().mockResolvedValue({
      id: "msg-1",
      senderId: "user-1",
      text: "Hello there",
      timestamp: new Date().toISOString(),
    });

    render(<ChatWindow conversation={conversation} currentUserId="user-1" onSendMessage={onSendMessage} />);

    const input = screen.getByPlaceholderText("Type a message…");
    fireEvent.change(input, { target: { value: "Hello there" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onSendMessage).toHaveBeenCalledWith("conv-1", "Hello there");
    expect(input).toHaveValue("");
  });

  it("opens a voice-only call panel when the voice button is pressed", () => {
    const conversation: ChatConversation = {
      id: "conv-1",
      lastActivity: new Date().toISOString(),
      participants: [
        { id: "user-1", name: "You", role: "student" },
        { id: "user-2", name: "Recruiter", role: "recruiter" },
      ],
      messages: [],
    };

    render(<ChatWindow conversation={conversation} currentUserId="user-1" onSendMessage={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /start voice call/i }));

    expect(screen.getByText("Voice Call")).toBeInTheDocument();
    expect(screen.getByText(/Voice calling is unavailable|Connecting…/i)).toBeInTheDocument();
    expect(screen.queryByText("Video Call")).not.toBeInTheDocument();
  });
});
