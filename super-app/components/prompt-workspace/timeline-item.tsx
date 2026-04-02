"use client";

import { Calendar, CheckSquare, AlertTriangle } from "lucide-react";
import type { TimelineItem } from "./types";

const TYPE_CONFIG: Record<TimelineItem["type"], { icon: typeof Calendar; color: string }> = {
  meeting: { icon: Calendar, color: "#5B5BF0" },
  task: { icon: CheckSquare, color: "#10b981" },
  deadline: { icon: AlertTriangle, color: "#ef4444" },
};

export function TimelineItemCard({ item }: { item: TimelineItem }) {
  const config = TYPE_CONFIG[item.type];
  const Icon = config.icon;

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData(
      "text/plain",
      `${item.time} — ${item.title} (${item.type})`
    );
    e.dataTransfer.effectAllowed = "copy";
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--ws-border-subtle)] bg-[var(--ws-surface-elevated)] hover:border-[var(--ws-accent)]/30 cursor-grab active:cursor-grabbing transition-all select-none"
    >
      <Icon className="w-3 h-3 shrink-0" style={{ color: config.color }} />
      <span className="text-[10px] font-mono font-semibold text-muted-foreground">
        {item.time}
      </span>
      <span className="text-[11px] font-medium text-foreground whitespace-nowrap">
        {item.title}
      </span>
    </div>
  );
}
