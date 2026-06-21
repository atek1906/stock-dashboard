"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import type { SearchResult } from "@/types";
import { useStockStore } from "@/store/useStockStore";
import { cn } from "@/lib/cn";

export function SearchBar() {
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addToWatchlist = useStockStore((s) => s.addToWatchlist);
  const setTab = useStockStore((s) => s.setTab);
  const setTicker = useStockStore((s) => s.setTicker);
  const isWatched = useStockStore((s) => s.isWatched);

  // Debounce the query so we don't hit the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(term.trim()), 300);
    return () => clearTimeout(t);
  }, [term]);

  const { data: results = [], isFetching } = useQuery<SearchResult[]>({
    queryKey: ["search", debounced],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(debounced)}`);
      if (!res.ok) throw new Error("search failed");
      return res.json();
    },
    enabled: debounced.length >= 2,
    staleTime: 60_000,
  });

  function pick(r: SearchResult) {
    addToWatchlist({ symbol: r.symbol, name: r.name });
    setTab("WATCHLIST");
    setTicker(r.symbol);
    setTerm("");
    setDebounced("");
    setOpen(false);
  }

  const showDropdown = open && debounced.length >= 2;

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-2.5">
        <Search className="h-4 w-4 shrink-0 text-muted" />
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setOpen(false), 150);
          }}
          placeholder="Cari saham (mis. BBRI, Apple, NVDA)…"
          className="h-9 w-full bg-transparent text-sm text-text outline-none placeholder:text-muted"
        />
      </div>

      {showDropdown && (
        <ul className="scroll-thin absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-border bg-surface shadow-xl">
          {isFetching && results.length === 0 && (
            <li className="px-3 py-2 text-xs text-muted">Mencari…</li>
          )}
          {!isFetching && results.length === 0 && (
            <li className="px-3 py-2 text-xs text-muted">Tidak ada hasil untuk “{debounced}”.</li>
          )}
          {results.map((r) => {
            const watched = isWatched(r.symbol);
            return (
              <li key={r.symbol}>
                <button
                  // onMouseDown fires before input blur so the click registers.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (blurTimer.current) clearTimeout(blurTimer.current);
                    pick(r);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-surface-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text">{r.symbol}</span>
                      <span className="truncate text-xs text-muted">{r.exchange}</span>
                    </div>
                    <div className="truncate text-xs text-muted">{r.name}</div>
                  </div>
                  <span
                    className={cn(
                      "flex items-center gap-1 text-xs",
                      watched ? "text-green" : "text-blue"
                    )}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {watched ? "Tersimpan" : "Tambah"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
