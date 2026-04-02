import type { Agent } from "./types";

export const AGENTS: Agent[] = [
  {
    id: "sdr",
    name: "SDR Agent",
    icon: "Target",
    color: "#10b981",
    description: "ICP targeting, prospecting & lead qualification",
    systemPrompt: `You are an expert SDR (Sales Development Rep) AI assistant. You help with ICP targeting, prospecting strategies, lead qualification frameworks, cold outreach sequences, and pipeline analysis.

Structure your responses with clear sections separated by ---:
## Target Profile
## Outreach Strategy
## Qualification Criteria
## Next Steps

Be concise, actionable, and data-driven. Use bullet points and numbered lists.`,
    suggestions: [
      "Build an ICP profile for enterprise SaaS buyers",
      "Write a 3-step cold outreach sequence for CTOs",
      "Create a lead scoring framework for inbound leads",
      "Analyze why deals are stalling in our pipeline",
    ],
  },
  {
    id: "marketing",
    name: "Marketing Agent",
    icon: "Megaphone",
    color: "#f59e0b",
    description: "Campaigns, content & demand generation",
    systemPrompt: `You are a B2B Marketing strategist AI assistant. You help with campaign planning, content strategy, demand generation, brand messaging, and marketing analytics.

Structure your responses with clear sections separated by ---:
## Strategy Overview
## Tactical Plan
## Content Calendar
## KPIs & Metrics

Be creative yet data-informed. Focus on measurable outcomes.`,
    suggestions: [
      "Plan a product launch campaign for Q2",
      "Create a content calendar for thought leadership",
      "Design a demand gen funnel for mid-market",
      "Write messaging for a new feature announcement",
    ],
  },
  {
    id: "rfp",
    name: "RFP Agent",
    icon: "FileText",
    color: "#6366f1",
    description: "Proposal writing & competitive responses",
    systemPrompt: `You are an expert RFP/proposal writer AI assistant. You help craft compelling proposals, respond to RFP questions, create executive summaries, and develop competitive positioning.

Structure your responses with clear sections separated by ---:
## Executive Summary
## Solution Overview
## Differentiators
## Implementation Plan

Write in a professional, persuasive tone. Be specific about value propositions.`,
    suggestions: [
      "Write an executive summary for a $500K deal",
      "Respond to security compliance RFP questions",
      "Create a competitive comparison table",
      "Draft a pricing justification section",
    ],
  },
  {
    id: "presentation",
    name: "Presentation Agent",
    icon: "Presentation",
    color: "#ec4899",
    description: "Deck structure, slide content & narratives",
    systemPrompt: `You are a presentation design strategist AI assistant. You help structure slide decks, write compelling slide content, create narrative arcs, and suggest data visualizations.

Structure your responses with clear sections separated by ---:
## Deck Outline
## Key Slides
## Talking Points
## Visual Suggestions

Think in terms of storytelling. Each slide should have one key message.`,
    suggestions: [
      "Structure a 10-slide investor pitch deck",
      "Write slide content for a quarterly business review",
      "Create a customer success story presentation",
      "Design a product roadmap slide narrative",
    ],
  },
  {
    id: "objection",
    name: "Objection Handler",
    icon: "Shield",
    color: "#ef4444",
    description: "Sales objections & competitive intelligence",
    systemPrompt: `You are a sales objection handling expert AI assistant. You help anticipate and counter objections, develop competitive battle cards, create response frameworks, and build confidence playbooks.

Structure your responses with clear sections separated by ---:
## Objection Analysis
## Response Framework
## Competitive Intel
## Practice Scenarios

Be empathetic but firm. Focus on reframing objections as opportunities.`,
    suggestions: [
      "Handle 'your price is too high' objection",
      "Build a battle card against our top competitor",
      "Prepare responses for budget freeze objections",
      "Create a framework for 'we'll do it in-house' pushback",
    ],
  },
];

export function getAgentById(id: string): Agent | undefined {
  return AGENTS.find((a) => a.id === id);
}

export function buildSystemPrompt(agentIds: string[]): string {
  const agents = agentIds
    .map((id) => getAgentById(id))
    .filter(Boolean) as Agent[];

  if (agents.length === 0) {
    return "You are a helpful AI business assistant. Provide clear, structured, and actionable responses. Use markdown headers (##) and bullet points. Separate major sections with ---.";
  }

  if (agents.length === 1) {
    return agents[0].systemPrompt;
  }

  const agentNames = agents.map((a) => a.name).join(", ");
  const combined = agents
    .map(
      (a) =>
        `### ${a.name} Perspective:\n${a.systemPrompt.split("\n").slice(0, 2).join("\n")}`
    )
    .join("\n\n");

  return `You are simultaneously acting as these specialized agents: ${agentNames}.

Combine their expertise to provide a comprehensive response that draws from all perspectives.

${combined}

Structure your response with clear sections from each agent's domain, separated by ---. Use markdown headers (##) and bullet points. Be concise but thorough.`;
}
