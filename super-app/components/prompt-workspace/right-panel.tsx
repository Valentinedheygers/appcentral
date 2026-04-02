"use client";

import { AGENTS } from "./agents";
import { AgentCard } from "./agent-card";
import { AgentSuggestions } from "./agent-suggestions";
import { Key, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";

export function RightPanel() {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("anthropic_api_key");
    if (saved) setApiKey(saved);
  }, []);

  function saveKey(key: string) {
    setApiKey(key);
    if (key) localStorage.setItem("anthropic_api_key", key);
    else localStorage.removeItem("anthropic_api_key");
  }

  return (
    <div className="h-full flex flex-col border-l border-[var(--ws-border-subtle)] bg-[var(--ws-panel-bg)] overflow-y-auto">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-[var(--ws-border-subtle)]">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          AI Agents
        </h3>
      </div>

      {/* Agent list */}
      <div className="p-3 space-y-2">
        {AGENTS.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>

      {/* Suggestions */}
      <AgentSuggestions />

      {/* API Key section at bottom */}
      <div className="mt-auto shrink-0 p-3 border-t border-[var(--ws-border-subtle)]">
        <div className="flex items-center gap-1.5 mb-2">
          <Key className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            API Key
          </span>
          {apiKey && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-500">
              Set
            </span>
          )}
        </div>
        <div className="relative">
          <input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => saveKey(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full rounded-md border border-[var(--ws-border-subtle)] bg-[var(--ws-surface)] text-foreground placeholder:text-muted-foreground px-2.5 py-1.5 pr-8 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--ws-accent)] transition-colors"
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </div>
  );
}
