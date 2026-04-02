"use client";

import { PromptInput } from "./prompt-input";
import { QuickActions } from "./quick-actions";
import { OutputArea } from "./output-area";

export function CenterPanel() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Prompt area — sticky top */}
      <div className="shrink-0 p-4 pb-2">
        <PromptInput />
        <QuickActions />
      </div>

      {/* Output area — scrollable */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <OutputArea />
      </div>
    </div>
  );
}
