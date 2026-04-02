import Anthropic from "@anthropic-ai/sdk";

const AGENT_PROMPTS: Record<string, string> = {
  sdr: `You are an expert SDR (Sales Development Rep) AI assistant. You help with ICP targeting, prospecting strategies, lead qualification frameworks, cold outreach sequences, and pipeline analysis.

Structure your responses with clear sections separated by ---:
## Target Profile
## Outreach Strategy
## Qualification Criteria
## Next Steps

Be concise, actionable, and data-driven. Use bullet points and numbered lists.`,

  marketing: `You are a B2B Marketing strategist AI assistant. You help with campaign planning, content strategy, demand generation, brand messaging, and marketing analytics.

Structure your responses with clear sections separated by ---:
## Strategy Overview
## Tactical Plan
## Content Calendar
## KPIs & Metrics

Be creative yet data-informed. Focus on measurable outcomes.`,

  rfp: `You are an expert RFP/proposal writer AI assistant. You help craft compelling proposals, respond to RFP questions, create executive summaries, and develop competitive positioning.

Structure your responses with clear sections separated by ---:
## Executive Summary
## Solution Overview
## Differentiators
## Implementation Plan

Write in a professional, persuasive tone. Be specific about value propositions.`,

  presentation: `You are a presentation design strategist AI assistant. You help structure slide decks, write compelling slide content, create narrative arcs, and suggest data visualizations.

Structure your responses with clear sections separated by ---:
## Deck Outline
## Key Slides
## Talking Points
## Visual Suggestions

Think in terms of storytelling. Each slide should have one key message.`,

  objection: `You are a sales objection handling expert AI assistant. You help anticipate and counter objections, develop competitive battle cards, create response frameworks, and build confidence playbooks.

Structure your responses with clear sections separated by ---:
## Objection Analysis
## Response Framework
## Competitive Intel
## Practice Scenarios

Be empathetic but firm. Focus on reframing objections as opportunities.`,
};

function buildSystemPrompt(agentIds: string[]): string {
  const agents = agentIds.filter((id) => AGENT_PROMPTS[id]);

  if (agents.length === 0) {
    return "You are a helpful AI business assistant. Provide clear, structured, and actionable responses. Use markdown headers (##) and bullet points. Separate major sections with ---.";
  }

  if (agents.length === 1) {
    return AGENT_PROMPTS[agents[0]];
  }

  const names = agents
    .map((id) => id.charAt(0).toUpperCase() + id.slice(1) + " Agent")
    .join(", ");

  const combined = agents
    .map((id) => `### ${id} perspective:\n${AGENT_PROMPTS[id].split("\n").slice(0, 2).join("\n")}`)
    .join("\n\n");

  return `You are simultaneously acting as: ${names}.
Combine their expertise for a comprehensive response.

${combined}

Structure your response with clear sections from each domain, separated by ---. Use markdown headers (##) and bullet points.`;
}

export async function POST(request: Request) {
  const { prompt, agents, apiKey } = await request.json();

  if (!prompt) {
    return new Response("Missing prompt", { status: 400 });
  }

  const key = apiKey || process.env.ANTHROPIC_API_KEY;

  if (!key) {
    return new Response(
      "No API key found. Enter your Anthropic API key in the settings.",
      { status: 401 }
    );
  }

  const client = new Anthropic({ apiKey: key });
  const systemPrompt = buildSystemPrompt(agents || []);

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const chunk = `data: ${event.delta.text}\n\n`;
            controller.enqueue(encoder.encode(chunk));
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        controller.enqueue(
          encoder.encode(`data: [Error: ${message}]\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
