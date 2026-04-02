"use client";

import { useWorkspace } from "./workspace-context";
import {
  Target,
  Megaphone,
  FileText,
  Presentation,
  Shield,
} from "lucide-react";
import type { Agent } from "./types";

const ICON_MAP: Record<string, typeof Target> = {
  Target,
  Megaphone,
  FileText,
  Presentation,
  Shield,
};

export function AgentCard({ agent }: { agent: Agent }) {
  const { activeAgents, dispatch } = useWorkspace();
  const active = activeAgents.includes(agent.id);
  const Icon = ICON_MAP[agent.icon] || Target;

  return (
    <button
      onClick={() => dispatch({ type: "TOGGLE_AGENT", payload: agent.id })}
      className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all cursor-pointer text-left ${
        active
          ? "border-current shadow-sm"
          : "border-transparent hover:bg-accent/50"
      }`}
      style={
        active
          ? {
              borderColor: agent.color + "50",
              backgroundColor: agent.color + "08",
            }
          : undefined
      }
    >
      {/* Icon */}
      <div
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: agent.color + "15" }}
      >
        <Icon className="w-4 h-4" style={{ color: agent.color }} />
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-foreground truncate">
          {agent.name}
        </div>
        <div className="text-[10px] text-muted-foreground truncate">
          {agent.description}
        </div>
      </div>

      {/* Active indicator */}
      <div
        className={`shrink-0 w-2 h-2 rounded-full transition-all ${
          active ? "scale-100" : "scale-0"
        }`}
        style={{ backgroundColor: agent.color }}
      />
    </button>
  );
}
