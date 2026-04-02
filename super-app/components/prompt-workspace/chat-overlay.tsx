"use client";

import { useState } from "react";
import { useWorkspace } from "./workspace-context";
import { X, Send } from "lucide-react";

export function ChatOverlay() {
  const { chatMessages, dispatch } = useWorkspace();
  const [input, setInput] = useState("");

  function handleSend() {
    if (!input.trim()) return;

    dispatch({
      type: "ADD_CHAT_MESSAGE",
      payload: {
        id: `msg-${Date.now()}`,
        role: "user",
        content: input,
        timestamp: Date.now(),
      },
    });

    // Simulated reply
    setTimeout(() => {
      dispatch({
        type: "ADD_CHAT_MESSAGE",
        payload: {
          id: `msg-${Date.now()}-reply`,
          role: "assistant",
          content:
            "Thanks for your message! This is a prototype chat — in production this would connect to your team messaging.",
          timestamp: Date.now(),
        },
      });
    }, 800);

    setInput("");
  }

  return (
    <div className="absolute left-[56px] top-0 bottom-0 w-[320px] z-50 bg-[var(--ws-panel-bg)] border-r border-[var(--ws-border-subtle)] shadow-xl flex flex-col">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-[var(--ws-border-subtle)]">
        <h3 className="text-sm font-semibold text-foreground">Team Chat</h3>
        <button
          onClick={() => dispatch({ type: "TOGGLE_CHAT" })}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatMessages.length === 0 && (
          <p className="text-xs text-muted-foreground text-center mt-8">
            No messages yet. Start a conversation.
          </p>
        )}
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-3 py-2 rounded-lg text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-[var(--ws-accent)] text-white"
                  : "bg-[var(--ws-surface)] text-foreground border border-[var(--ws-border-subtle)]"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="shrink-0 p-3 border-t border-[var(--ws-border-subtle)]">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 rounded-lg border border-[var(--ws-border-subtle)] bg-[var(--ws-surface)] text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:ring-1 focus:ring-[var(--ws-accent)]"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2 rounded-lg bg-[var(--ws-accent)] text-white disabled:opacity-40 transition-opacity"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
