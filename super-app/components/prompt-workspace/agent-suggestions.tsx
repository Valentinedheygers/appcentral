"use client";

import { useWorkspace } from "./workspace-context";
import { AGENTS } from "./agents";
import { Lightbulb } from "lucide-react";

export function AgentSuggestions() {
  const { activeAgents, dispatch } = useWorkspace();

  const suggestions = activeAgents
    .map((id) => AGENTS.find((a) => a.id === id))
    .filter(Boolean)
    .flatMap((agent) =>
      agent!.suggestions.map((s) => ({
        agentId: agent!.id,
        agentName: agent!.name,
        color: agent!.color,
        text: s,
      }))
    );

  if (suggestions.length === 0) return null;

  return (
    <div className="px-3 pb-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Lightbulb className="w-3 h-3 text-[var(--ws-accent)]" />
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Suggestions
        </span>
      </div>
      <div className="space-y-1.5">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => {
              dispatch({ type: "SET_PROMPT", payload: s.text });
            }}
            className="w-full text-left px-2.5 py-2 rounded-lg text-[11px] leading-snug text-muted-foreground hover:text-foreground border border-transparent hover:border-[var(--ws-border-subtle)] hover:bg-[var(--ws-surface)] transition-all cursor-pointer"
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full mr-2 relative top-[-1px]"
              style={{ backgroundColor: s.color }}
            />
            {s.text}
          </button>
        ))}
      </div>
    </div>
  );
}
