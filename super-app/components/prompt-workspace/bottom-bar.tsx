"use client";

import { useWorkspace } from "./workspace-context";
import { TimelineItemCard } from "./timeline-item";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

export function BottomBar() {
  const { timelineItems } = useWorkspace();
  const scrollRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  function scroll(dir: "left" | "right") {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -200 : 200,
      behavior: "smooth",
    });
  }

  return (
    <div className="h-full flex items-center border-t border-[var(--ws-border-subtle)] bg-[var(--ws-panel-bg)]">
      {/* Current time */}
      <div className="shrink-0 flex items-center gap-1.5 px-3 border-r border-[var(--ws-border-subtle)]">
        <Clock className="w-3.5 h-3.5 text-[var(--ws-accent)]" />
        <span className="text-xs font-mono font-semibold text-foreground">
          {timeStr}
        </span>
      </div>

      {/* Scroll left */}
      <button
        onClick={() => scroll("left")}
        className="shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Timeline items */}
      <div
        ref={scrollRef}
        className="flex-1 flex items-center gap-2 overflow-x-auto px-2 scrollbar-hide"
        style={{ scrollbarWidth: "none" }}
      >
        {timelineItems.map((item) => (
          <TimelineItemCard key={item.id} item={item} />
        ))}
      </div>

      {/* Scroll right */}
      <button
        onClick={() => scroll("right")}
        className="shrink-0 p-1 mr-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
