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
  Menu,
  X,
  Pen,
  TrainFront,
  Layers,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useWorkspace } from "./workspace-context";
import { useState, useEffect, useRef } from "react";

const TABS = [
  { id: "Dashboard", icon: LayoutDashboard },
  { id: "Domino Apps", icon: Blocks },
  { id: "CRM", icon: Users },
  { id: "Expenses", icon: Receipt },
  { id: "Documents", icon: FileStack },
  { id: "Analytics", icon: BarChart3 },
];

const PUIT_NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/crm", label: "CRM", icon: Users },
  { href: "/prompt-workspace", label: "Prompt Workspace", icon: BrainCircuit },
  { href: "/linkedin-generator", label: "LinkedIn Generator", icon: Pen },
  { href: "/trains", label: "Trains de Nuit", icon: TrainFront },
  { href: "/tech-comparison", label: "Tech Comparison", icon: Layers },
  { href: "/trump-tracker", label: "Trump Tracker", icon: TrendingUp },
];

export function TopBar() {
  const { activeTab, dispatch } = useWorkspace();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <div className="h-full flex items-center justify-between px-3 border-b border-[var(--ws-border-subtle)] bg-[var(--ws-panel-bg)]">
      {/* Left: Puit menu + Logo + tabs */}
      <div className="flex items-center gap-1">
        {/* Puit menu */}
        <div ref={menuRef} className="relative mr-2">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-semibold transition-colors hover:bg-accent/50"
          >
            {menuOpen ? (
              <X className="w-3.5 h-3.5 text-foreground" />
            ) : (
              <Menu className="w-3.5 h-3.5 text-foreground" />
            )}
            <span className="text-primary text-xs font-bold">puit</span>
          </button>

          {menuOpen && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
                <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary text-primary-foreground font-bold text-[10px]">
                  p
                </div>
                <span className="text-xs font-semibold text-foreground">puit</span>
              </div>
              <nav className="p-1.5">
                {PUIT_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                      item.href === "/prompt-workspace"
                        ? "bg-[var(--ws-accent-bg)] text-[var(--ws-accent)]"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-[var(--ws-border-subtle)] mr-2" />

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
