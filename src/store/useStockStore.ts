import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Tab, WatchItem } from "@/types";

interface StockStore {
  activeTab: Tab;
  selectedTicker: string | null;
  watchlist: WatchItem[];
  setTab: (tab: Tab) => void;
  setTicker: (ticker: string | null) => void;
  addToWatchlist: (item: WatchItem) => void;
  removeFromWatchlist: (symbol: string) => void;
  isWatched: (symbol: string) => boolean;
}

/**
 * Global UI selection state plus the user's watchlist. Only the watchlist is
 * persisted to localStorage so saved symbols survive reloads; the active tab
 * and selection reset on each visit.
 */
export const useStockStore = create<StockStore>()(
  persist(
    (set, get) => ({
      activeTab: "IHSG",
      selectedTicker: null,
      watchlist: [],
      setTab: (activeTab) => set({ activeTab, selectedTicker: null }),
      setTicker: (selectedTicker) => set({ selectedTicker }),
      addToWatchlist: (item) =>
        set((s) =>
          s.watchlist.some((w) => w.symbol === item.symbol)
            ? s
            : { watchlist: [...s.watchlist, item] }
        ),
      removeFromWatchlist: (symbol) =>
        set((s) => ({ watchlist: s.watchlist.filter((w) => w.symbol !== symbol) })),
      isWatched: (symbol) => get().watchlist.some((w) => w.symbol === symbol),
    }),
    {
      name: "stockwise-watchlist",
      partialize: (s) => ({ watchlist: s.watchlist }),
    }
  )
);
