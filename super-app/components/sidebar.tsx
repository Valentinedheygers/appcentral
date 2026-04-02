"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrainFront,
  Pen,
  Layers,
  Menu,
  X,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useState, useEffect, useRef } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/linkedin-generator", label: "LinkedIn Generator", icon: Pen },
  { href: "/trains", label: "Trains de Nuit", icon: TrainFront },
  { href: "/tech-comparison", label: "Tech Comparison", icon: Layers },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on route change
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div ref={menuRef} className="fixed top-4 left-4 z-[1000]">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card/90 backdrop-blur-md border border-border shadow-lg hover:shadow-xl transition-all"
      >
        {open ? (
          <X className="w-4 h-4 text-foreground" />
        ) : (
          <Menu className="w-4 h-4 text-foreground" />
        )}
        <span className="text-xs font-semibold text-primary hidden sm:inline">
          Charles Tools
        </span>
      </button>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-primary-foreground font-bold text-xs">
              C
            </div>
            <div>
              <div className="font-semibold text-sm text-foreground">
                Charles Tools
              </div>
              <div className="text-[10px] text-muted-foreground">
                HCLSoftware
              </div>
            </div>
          </div>

          {/* Nav items */}
          <nav className="p-2">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-border flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">v1.0</span>
            <ThemeToggle />
          </div>
        </div>
      )}
    </div>
  );
}
