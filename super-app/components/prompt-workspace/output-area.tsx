"use client";

import { useWorkspace } from "./workspace-context";
import { OutputBlockCard } from "./output-block";
import { Loader2, Sparkles } from "lucide-react";

export function OutputArea() {
  const { outputBlocks, streamingText, isStreaming } = useWorkspace();

  if (!isStreaming && outputBlocks.length === 0 && !streamingText) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-[var(--ws-accent-bg)] flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-[var(--ws-accent)] opacity-60" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">
          Your AI Workspace
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Type a prompt above or select an AI agent from the right panel.
          Drag timeline items to add context. Use quick actions for common tasks.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Streaming indicator */}
      {isStreaming && streamingText && (
        <div className="rounded-xl border border-[var(--ws-accent)]/20 bg-[var(--ws-surface-elevated)] p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Loader2 className="w-4 h-4 text-[var(--ws-accent)] animate-spin" />
            <span className="text-xs font-semibold text-[var(--ws-accent)]">
              AI is thinking...
            </span>
          </div>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground font-[family-name:var(--font-geist-sans)]">
            {streamingText}
          </pre>
        </div>
      )}

      {/* Completed blocks */}
      {outputBlocks.map((block) => (
        <OutputBlockCard key={block.id} block={block} />
      ))}
    </div>
  );
}
