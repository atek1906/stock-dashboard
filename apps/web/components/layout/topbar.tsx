"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useMetricsStore, useUIStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "./breadcrumb";
import { LiveIndicator } from "./live-indicator";
import { ThemeToggle } from "./theme-toggle";

export function Topbar() {
  const lastUpdated = useMetricsStore((s) => s.lastUpdated);
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const toggleMobileNav = useUIStore((s) => s.toggleMobileNav);

  // Render the timestamp only after mount to avoid SSR/client mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-bg/80 px-4 backdrop-blur md:px-6">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Open navigation"
        className="md:hidden"
        onClick={toggleMobileNav}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        aria-label="Collapse sidebar"
        className="hidden md:inline-flex"
        onClick={toggleSidebar}
      >
        {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
      </Button>

      <Breadcrumb />

      <div className="ml-auto flex items-center gap-3 md:gap-4">
        <span className="hidden text-xs text-text-secondary sm:inline">
          Updated <time>{mounted && lastUpdated ? format(lastUpdated, "HH:mm:ss") : "—"}</time>
        </span>
        <LiveIndicator />
        <ThemeToggle />
      </div>
    </header>
  );
}
