"use client";

import {
  LayoutDashboard,
  Blocks,
  Users,
  Receipt,
  FileStack,
  BarChart3,
  BrainCircuit,
  Settings,
} from "lucide-react";
import { useWorkspace } from "./workspace-context";

const TABS = [
  { id: "Dashboard", icon: LayoutDashboard },
  { id: "Domino Apps", icon: Blocks },
  { id: "CRM", icon: Users },
  { id: "Expenses", icon: Receipt },
  { id: "Documents", icon: FileStack },
  { id: "Analytics", icon: BarChart3 },
];

export function TopBar() {
  const { activeTab, dispatch } = useWorkspace();

  return (
    <div className="h-full flex items-center justify-between px-3 border-b border-[var(--ws-border-subtle)] bg-[var(--ws-panel-bg)]">
      {/* Left: Logo + tabs */}
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-2 mr-4 px-2">
          <BrainCircuit className="w-5 h-5 text-[var(--ws-accent)]" />
          <span className="text-sm font-bold text-foreground tracking-tight hidden sm:inline">
            Prompt Workspace
          </span>
        </div>

        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => dispatch({ type: "SET_TAB", payload: tab.id })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                active
                  ? "bg-[var(--ws-accent-bg)] text-[var(--ws-accent)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{tab.id}</span>
            </button>
          );
        })}
      </div>

      {/* Right: Settings + avatar */}
      <div className="flex items-center gap-2">
        <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
          <Settings className="w-4 h-4" />
        </button>
        <div className="w-7 h-7 rounded-full bg-[var(--ws-accent)] flex items-center justify-center text-white text-xs font-bold">
          CC
        </div>
      </div>
    </div>
  );
}
