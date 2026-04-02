"use client";

import { useWorkspace } from "./workspace-context";
import { AGENTS } from "./agents";
import { Send, Loader2, X, Sparkles } from "lucide-react";
import { useRef } from "react";

export function PromptInput() {
  const {
    prompt,
    activeAgents,
    isStreaming,
    dispatch,
    submitPrompt,
    cancelStream,
  } = useWorkspace();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitPrompt();
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const data = e.dataTransfer.getData("text/plain");
    if (data) {
      dispatch({ type: "ADD_CONTEXT", payload: data });
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }

  const activeAgentNames = activeAgents
    .map((id) => AGENTS.find((a) => a.id === id))
    .filter(Boolean);

  return (
    <div
      className="rounded-xl border border-[var(--ws-border-subtle)] bg-[var(--ws-surface-elevated)] shadow-sm transition-all focus-within:border-[var(--ws-accent)] focus-within:shadow-md focus-within:shadow-[var(--ws-accent-bg)]"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Active agent badges */}
      {activeAgentNames.length > 0 && (
        <div className="flex items-center gap-1.5 px-4 pt-3 pb-0">
          <Sparkles className="w-3 h-3 text-[var(--ws-accent)]" />
          <span className="text-[10px] text-muted-foreground font-medium">Using:</span>
          {activeAgentNames.map((agent) => (
            <span
              key={agent!.id}
              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: agent!.color + "18",
                color: agent!.color,
              }}
            >
              {agent!.name}
              <button
                onClick={() =>
                  dispatch({ type: "TOGGLE_AGENT", payload: agent!.id })
                }
                className="hover:opacity-70"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={prompt}
        onChange={(e) =>
          dispatch({ type: "SET_PROMPT", payload: e.target.value })
        }
        onKeyDown={handleKeyDown}
        placeholder="Ask anything... Type your prompt or drag a timeline item here"
        rows={3}
        className="w-full bg-transparent text-foreground placeholder:text-muted-foreground px-4 py-3 text-sm leading-relaxed resize-none focus:outline-none"
      />

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-4 pb-3">
        <span className="text-[10px] text-muted-foreground">
          Shift+Enter for new line
        </span>
        <div className="flex items-center gap-2">
          {isStreaming && (
            <button
              onClick={cancelStream}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--ws-border-subtle)] text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            onClick={submitPrompt}
            disabled={!prompt.trim() || isStreaming}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--ws-accent)] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity cursor-pointer"
          >
            {isStreaming ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Streaming...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Send
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
