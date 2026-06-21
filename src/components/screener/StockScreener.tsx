"use client";

import type { StockData, Tab } from "@/types";
import { useStockStore } from "@/store/useStockStore";
import { StockTable } from "./StockTable";
import { SearchBar } from "./SearchBar";
import { cn } from "@/lib/cn";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "IHSG", label: "🇮🇩 IHSG" },
  { key: "NASDAQ", label: "🇺🇸 NASDAQ" },
  { key: "WATCHLIST", label: "⭐ Watchlist" },
];

interface StockScreenerProps {
  stocks: StockData[];
  isLoading: boolean;
}

export function StockScreener({ stocks, isLoading }: StockScreenerProps) {
  const activeTab = useStockStore((s) => s.activeTab);
  const setTab = useStockStore((s) => s.setTab);
  const selectedTicker = useStockStore((s) => s.selectedTicker);
  const setTicker = useStockStore((s) => s.setTicker);
  const watchlist = useStockStore((s) => s.watchlist);
  const removeFromWatchlist = useStockStore((s) => s.removeFromWatchlist);

  const isWatchlist = activeTab === "WATCHLIST";
  const emptyWatchlist = isWatchlist && watchlist.length === 0;

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="border-b border-border p-2">
        <SearchBar />
        <div className="mt-2 flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                activeTab === t.key
                  ? "bg-surface-2 text-text"
                  : "text-muted hover:bg-surface-2/60 hover:text-text"
              )}
            >
              {t.label}
              {t.key === "WATCHLIST" && watchlist.length > 0 && (
                <span className="ml-1 text-xs text-muted">({watchlist.length})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {emptyWatchlist ? (
        <div className="px-4 py-12 text-center text-sm text-muted">
          <p>Watchlist masih kosong.</p>
          <p className="mt-1 text-xs">Cari saham di kotak pencarian di atas untuk menambahkannya.</p>
        </div>
      ) : (
        <StockTable
          stocks={stocks}
          isLoading={isLoading}
          selectedTicker={selectedTicker}
          onSelect={setTicker}
          onRemove={isWatchlist ? removeFromWatchlist : undefined}
        />
      )}
    </div>
  );
}
