"use client";

import { useQuery } from "@tanstack/react-query";
import type { MarketIndex } from "@/types";

const REFRESH_MS = Number(process.env.NEXT_PUBLIC_REFRESH_MS ?? 300_000);

async function fetchMarket(): Promise<MarketIndex[]> {
  const res = await fetch("/api/market");
  if (!res.ok) throw new Error("Failed to load market data");
  return res.json();
}

/** Market index cards, auto-refreshing every 5 minutes. */
export function useMarketData() {
  return useQuery({
    queryKey: ["market"],
    queryFn: fetchMarket,
    refetchInterval: REFRESH_MS,
    retry: 2,
    staleTime: REFRESH_MS,
  });
}
