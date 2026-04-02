"use client";

import {
  MessageSquare,
  Video,
  Mail,
  FolderOpen,
  PenTool,
  Users,
} from "lucide-react";
import { useWorkspace } from "./workspace-context";
import { ChatOverlay } from "./chat-overlay";

const TOOLS = [
  { id: "chat", icon: MessageSquare, label: "Chat", action: "TOGGLE_CHAT" as const },
  { id: "meet", icon: Video, label: "Meet" },
  { id: "email", icon: Mail, label: "Email" },
  { id: "files", icon: FolderOpen, label: "Files" },
  { id: "edit", icon: PenTool, label: "Edit" },
  { id: "team", icon: Users, label: "Team" },
];

export function LeftPanel() {
  const { chatPanelOpen, dispatch } = useWorkspace();

  return (
    <>
      <div className="h-full w-[56px] flex flex-col items-center py-3 gap-1 border-r border-[var(--ws-border-subtle)] bg-[var(--ws-panel-bg)]">
        {TOOLS.map((tool) => {
          const isChat = tool.id === "chat";
          const active = isChat && chatPanelOpen;

          return (
            <button
              key={tool.id}
              title={tool.label}
              onClick={() => {
                if (isChat) {
                  dispatch({ type: "TOGGLE_CHAT" });
                }
              }}
              className={`relative flex items-center justify-center w-10 h-10 rounded-lg transition-all cursor-pointer ${
                active
                  ? "bg-[var(--ws-accent-bg)] text-[var(--ws-accent)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <tool.icon className="w-[18px] h-[18px]" />
              {isChat && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--ws-accent)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Chat overlay */}
      {chatPanelOpen && <ChatOverlay />}
    </>
  );
}
