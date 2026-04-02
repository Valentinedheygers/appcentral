"use client";

import { useState, useRef } from "react";
import { Copy, Check, Loader2, Sparkles } from "lucide-react";

const FORMATS = [
  { id: "story", label: "Story", emoji: "📖" },
  { id: "listicle", label: "Listicle", emoji: "📋" },
  { id: "hot_take", label: "Hot Take", emoji: "🔥" },
  { id: "lesson", label: "Lesson", emoji: "🎓" },
  { id: "behind_the_scenes", label: "Behind the Scenes", emoji: "🎬" },
] as const;

type Format = (typeof FORMATS)[number]["id"];

export default function LinkedInGenerator() {
  const [input, setInput] = useState("");
  const [format, setFormat] = useState<Format>("story");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function generate() {
    if (!input.trim() || loading) return;

    setOutput("");
    setLoading(true);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, format }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.text();
        setOutput(`Error: ${err}`);
        setLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            accumulated += data;
            setOutput(accumulated);
          }
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== "AbortError") {
        setOutput(`Error: ${e.message}`);
      }
    } finally {
      setLoading(false);
    }
  }

  function cancel() {
    abortRef.current?.abort();
    setLoading(false);
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const charCount = output.length;
  const charColor =
    charCount > 1200
      ? "text-red-500"
      : charCount > 1000
        ? "text-yellow-500"
        : "text-muted-foreground";

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            AI Writer
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          LinkedIn Post Generator
        </h1>
        <p className="text-muted-foreground mt-1">
          Transform any idea into a viral LinkedIn post powered by Claude AI.
        </p>
      </div>

      {/* Input area */}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="post-input"
            className="block text-sm font-medium text-card-foreground mb-2"
          >
            Your idea or topic
          </label>
          <textarea
            id="post-input"
            rows={5}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your idea, paste an article, share an experience..."
            className="w-full rounded-lg border border-border bg-card text-card-foreground placeholder:text-muted-foreground p-4 text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
          />
        </div>

        {/* Format buttons */}
        <div>
          <label className="block text-sm font-medium text-card-foreground mb-2">
            Post format
          </label>
          <div className="flex flex-wrap gap-2">
            {FORMATS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFormat(f.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-150 cursor-pointer ${
                  format === f.id
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-card text-card-foreground hover:border-primary/40 hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <span className="mr-1.5">{f.emoji}</span>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Generate / Cancel button */}
        <div className="flex gap-3">
          <button
            onClick={generate}
            disabled={!input.trim() || loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Post
              </>
            )}
          </button>

          {loading && (
            <button
              onClick={cancel}
              className="px-4 py-2.5 rounded-lg border border-border bg-card text-card-foreground text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Output area */}
      {output && (
        <div className="mt-8 rounded-xl border border-border bg-card overflow-hidden">
          {/* Output header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-card-foreground">
                Generated Post
              </span>
              <span className={`text-xs font-mono ${charColor}`}>
                {charCount} / 1200 chars
              </span>
            </div>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-accent text-accent-foreground hover:opacity-80 transition-opacity cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>

          {/* Output body */}
          <div className="p-5">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-card-foreground font-[family-name:var(--font-geist-sans)]">
              {output}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
