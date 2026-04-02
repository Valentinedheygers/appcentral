"use client";

import { useWorkspace } from "./workspace-context";
import { Mail, Presentation, FileText, BarChart3 } from "lucide-react";

const ACTIONS = [
  {
    label: "Draft email",
    icon: Mail,
    agents: ["sdr"],
    prompt:
      "Draft a professional cold outreach email for a prospect. Include a compelling subject line, personalized opening, value proposition, and clear CTA.",
  },
  {
    label: "Create deck",
    icon: Presentation,
    agents: ["presentation"],
    prompt:
      "Create a detailed slide deck outline for a product overview presentation. Include slide titles, key talking points, and visual suggestions for each slide.",
  },
  {
    label: "Write proposal",
    icon: FileText,
    agents: ["rfp"],
    prompt:
      "Write a proposal executive summary for a new enterprise deal. Include the business challenge, proposed solution, expected outcomes, and next steps.",
  },
  {
    label: "Analyze pipeline",
    icon: BarChart3,
    agents: ["sdr"],
    prompt:
      "Analyze the current sales pipeline and suggest strategies to improve conversion rates. Cover deal velocity, common stall points, and prioritization framework.",
  },
];

export function QuickActions() {
  const { dispatch } = useWorkspace();

  function handleAction(action: (typeof ACTIONS)[number]) {
    // Set the prompt
    dispatch({ type: "SET_PROMPT", payload: action.prompt });

    // Activate the relevant agents
    action.agents.forEach((agentId) => {
      dispatch({ type: "TOGGLE_AGENT", payload: agentId });
    });
  }

  return (
    <div className="flex items-center gap-2 mt-3 mb-2 flex-wrap">
      <span className="text-[10px] text-muted-foreground font-medium">
        Quick:
      </span>
      {ACTIONS.map((action) => (
        <button
          key={action.label}
          onClick={() => handleAction(action)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border border-[var(--ws-border-subtle)] text-muted-foreground hover:text-foreground hover:border-[var(--ws-accent)]/30 hover:bg-[var(--ws-accent-bg)] transition-all cursor-pointer"
        >
          <action.icon className="w-3 h-3" />
          {action.label}
        </button>
      ))}
    </div>
  );
}
