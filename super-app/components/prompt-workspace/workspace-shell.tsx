"use client";

import { WorkspaceProvider } from "./workspace-context";
import { TopBar } from "./top-bar";
import { LeftPanel } from "./left-panel";
import { CenterPanel } from "./center-panel";
import { RightPanel } from "./right-panel";
import { BottomBar } from "./bottom-bar";

export function WorkspaceShell() {
  return (
    <WorkspaceProvider>
      <div className="h-screen w-screen overflow-hidden grid grid-rows-[48px_1fr_56px] grid-cols-[56px_1fr_260px] bg-[var(--ws-surface)]">
        {/* Row 1: Top bar spans all columns */}
        <div className="col-span-3">
          <TopBar />
        </div>

        {/* Row 2: Three panels */}
        <div className="relative">
          <LeftPanel />
        </div>
        <div className="overflow-hidden">
          <CenterPanel />
        </div>
        <div className="overflow-hidden">
          <RightPanel />
        </div>

        {/* Row 3: Bottom bar spans all columns */}
        <div className="col-span-3">
          <BottomBar />
        </div>
      </div>
    </WorkspaceProvider>
  );
}
