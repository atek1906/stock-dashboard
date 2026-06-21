"use client";

import { useEffect, useState } from "react";
import { useMarketData } from "@/hooks/useMarketData";

function formatWIB(ts: number): string {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
    hour12: false,
  }).format(ts);
}

export function Navbar() {
  const { dataUpdatedAt } = useMarketData();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-40 h-[52px] border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-full max-w-[1400px] items-center gap-3 px-4">
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-blue">📈 Stockwise</span>
          <span className="hidden text-xs text-muted sm:inline">IHSG &amp; NASDAQ Forecaster</span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {mounted && dataUpdatedAt > 0 && (
            <span className="hidden text-xs text-muted md:inline">
              Last updated: {formatWIB(dataUpdatedAt)} WIB
            </span>
          )}
          <span className="flex items-center gap-2 rounded-full border border-border bg-surface px-2.5 py-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-green" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green" />
            </span>
            <span className="text-[11px] font-medium text-muted">Live · updates every 5m</span>
          </span>
        </div>
      </div>
    </header>
  );
}
