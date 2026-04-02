import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are a LinkedIn viral content expert. Your job is to transform any input into a high-performing LinkedIn post.

Rules:
1. Start with a STRONG hook (1 line) — surprising, provocative, or emotional. Never start with "I".
2. Short paragraphs (1-2 lines max), separated by blank lines.
3. Structure: hook → story/insight → lesson → call to action.
4. End with a question or CTA to drive comments.
5. 3-5 relevant hashtags at the end.
6. No external links in the post body.
7. Max 1200 characters for optimal reach.
8. Use the viral post format the user selects.

Formats: story, listicle, hot_take, lesson, behind_the_scenes
Always write in the same language as the input.
Return ONLY the post text, ready to copy-paste.`;

export async function POST(request: Request) {
  const { input, format } = await request.json();

  if (!input || !format) {
    return new Response("Missing input or format", { status: 400 });
  }

  const client = new Anthropic();

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Format: ${format}\n\nInput: ${input}`,
      },
    ],
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
          encoder.encode(`data: \n\n[Error: ${message}]\n\n`)
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
