"use client";

import { useState } from "react";
import { Copy, Check, Pencil, Download, ListChecks, BarChart3, FileText, Layers } from "lucide-react";
import type { OutputBlock } from "./types";

const TYPE_CONFIG: Record<OutputBlock["type"], { icon: typeof FileText; label: string; color: string }> = {
  text: { icon: FileText, label: "Content", color: "#5B5BF0" },
  phases: { icon: Layers, label: "Phases", color: "#10b981" },
  metrics: { icon: BarChart3, label: "Metrics", color: "#f59e0b" },
  actions: { icon: ListChecks, label: "Actions", color: "#ec4899" },
};

export function OutputBlockCard({ block }: { block: OutputBlock }) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(block.content);

  const config = TYPE_CONFIG[block.type];
  const Icon = config.icon;

  async function handleCopy() {
    await navigator.clipboard.writeText(block.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleExport() {
    const blob = new Blob([block.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${block.title.toLowerCase().replace(/\s+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-xl border border-[var(--ws-border-subtle)] bg-[var(--ws-surface-elevated)] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--ws-border-subtle)] bg-[var(--ws-surface)]">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ backgroundColor: config.color + "15" }}
          >
            <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
          </div>
          <span className="text-xs font-semibold text-foreground">
            {block.title}
          </span>
          <span
            className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase"
            style={{
              backgroundColor: config.color + "15",
              color: config.color,
            }}
          >
            {config.label}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            title="Copy"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={() => setEditing(!editing)}
            className={`p-1.5 rounded-md transition-colors ${
              editing
                ? "text-[var(--ws-accent)] bg-[var(--ws-accent-bg)]"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleExport}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            title="Export as .md"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {editing ? (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full min-h-[120px] bg-[var(--ws-surface)] border border-[var(--ws-border-subtle)] rounded-lg p-3 text-sm text-foreground font-[family-name:var(--font-geist-sans)] leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-[var(--ws-accent)]"
          />
        ) : (
          <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground font-[family-name:var(--font-geist-sans)]">
            {block.content}
          </pre>
        )}
      </div>
    </div>
  );
}
