"use client";

import { useState, useRef, useEffect } from "react";
import { Copy, Check, Loader2, Sparkles, Key, Eye, EyeOff } from "lucide-react";

const FORMATS = [
  { id: "story", label: "Story", emoji: "\uD83D\uDCD6" },
  { id: "listicle", label: "Listicle", emoji: "\uD83D\uDCCB" },
  { id: "hot_take", label: "Hot Take", emoji: "\uD83D\uDD25" },
  { id: "lesson", label: "Lesson", emoji: "\uD83C\uDF93" },
  { id: "behind_the_scenes", label: "Behind the Scenes", emoji: "\uD83C\uDFAC" },
] as const;

type Format = (typeof FORMATS)[number]["id"];

const ENGAGEMENT_HACKS = [
  { tip: "Start with a bold hook", detail: "First line = 90% of your reach. Make it surprising or controversial." },
  { tip: "Use white space", detail: "Short paragraphs (1-2 lines). Walls of text kill engagement." },
  { tip: "End with a question", detail: "Questions drive 2x more comments than statements." },
  { tip: "Post at peak hours", detail: "Tue-Thu 8-10am local time gets the most impressions." },
  { tip: "No links in the post", detail: "LinkedIn suppresses posts with external links. Put them in comments." },
  { tip: "Use the 1-3-1 formula", detail: "1 hook line, 3 value paragraphs, 1 call to action." },
  { tip: "Reply to every comment", detail: "Each reply counts as engagement and boosts your post in the algorithm." },
  { tip: "Tag people sparingly", detail: "Tag 1-3 relevant people max. Over-tagging looks spammy." },
];

export default function LinkedInGenerator() {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [input, setInput] = useState("");
  const [format, setFormat] = useState<Format>("story");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("anthropic_api_key");
    if (saved) setApiKey(saved);
  }, []);

  function saveApiKey(key: string) {
    setApiKey(key);
    if (key) localStorage.setItem("anthropic_api_key", key);
    else localStorage.removeItem("anthropic_api_key");
  }

  async function generate() {
    if (!input.trim() || loading) return;

    setOutput("");
    setError("");
    setLoading(true);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, format, apiKey }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const errText = await res.text();
        setError(errText || `Server error (${res.status})`);
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

      if (!accumulated) {
        setError("No response received. Check that ANTHROPIC_API_KEY is set in your environment.");
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== "AbortError") {
        setError(e.message);
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

      {/* API Key */}
      <div className="mb-6 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <Key className="w-4 h-4 text-primary" />
          <label className="text-sm font-medium text-card-foreground">
            Anthropic API Key
          </label>
          {apiKey && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/30">
              Saved
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => saveApiKey(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full rounded-lg border border-border bg-muted text-card-foreground placeholder:text-muted-foreground px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-card-foreground transition-colors"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          Your key is stored locally in your browser. Never shared or sent to our servers.
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

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-400 font-medium">Generation failed</p>
          <p className="text-xs text-red-400/70 mt-1">{error}</p>
        </div>
      )}

      {/* Output area */}
      {output && (
        <div className="mt-8 rounded-xl border border-border bg-card overflow-hidden">
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
          <div className="p-5">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-card-foreground font-[family-name:var(--font-geist-sans)]">
              {output}
            </pre>
          </div>
        </div>
      )}

      {/* Engagement Hacks */}
      <div className="mt-10">
        <h2 className="text-lg font-bold tracking-tight mb-4">
          Top LinkedIn Engagement Hacks
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ENGAGEMENT_HACKS.map((hack) => (
            <div
              key={hack.tip}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="text-sm font-semibold text-primary mb-1">
                {hack.tip}
              </div>
              <div className="text-xs text-muted-foreground leading-relaxed">
                {hack.detail}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
