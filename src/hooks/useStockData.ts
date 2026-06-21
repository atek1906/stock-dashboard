"use client";

import { useQuery } from "@tanstack/react-query";
import type { StockData } from "@/types";

const REFRESH_MS = Number(process.env.NEXT_PUBLIC_REFRESH_MS ?? 300_000);

async function fetchStocks(symbols: string[], range: string): Promise<StockData[]> {
  if (symbols.length === 0) return [];
  const res = await fetch(`/api/stocks?symbols=${symbols.join(",")}&range=${range}`);
  if (!res.ok) throw new Error("Failed to load stock data");
  return res.json();
}

/**
 * Screener + chart data for an arbitrary set of symbols, auto-refreshing every
 * 5 minutes. `keyLabel` namespaces the cache (e.g. "IHSG", "NASDAQ",
 * "WATCHLIST"). The chart for a selected stock renders from this cached payload.
 */
export function useStockData(symbols: string[], keyLabel: string, range = "6mo") {
  return useQuery({
    queryKey: ["stocks", keyLabel, range, symbols.join(",")],
    queryFn: () => fetchStocks(symbols, range),
    enabled: symbols.length > 0,
    refetchInterval: REFRESH_MS,
    retry: 2,
    staleTime: REFRESH_MS,
  });
}
