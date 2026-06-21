"use client";

import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { StockData, StockQuote } from "@/types";
import { useStockStore } from "@/store/useStockStore";
import { useStockData } from "@/hooks/useStockData";
import { symbolsForMarket } from "@/lib/stocks";
import { useToast } from "@/components/ui/toast";
import { MarketOverview } from "@/components/market/MarketOverview";
import { StockScreener } from "@/components/screener/StockScreener";
import { SignalBadge } from "@/components/screener/SignalBadge";
import { PriceChart } from "@/components/chart/PriceChart";
import { RSIChart } from "@/components/chart/RSIChart";
import { ForecastPanel } from "@/components/analysis/ForecastPanel";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCompact, formatPct, formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";

export default function DashboardPage() {
  const activeTab = useStockStore((s) => s.activeTab);
  const selectedTicker = useStockStore((s) => s.selectedTicker);
  const setTicker = useStockStore((s) => s.setTicker);
  const watchlist = useStockStore((s) => s.watchlist);

  const symbols =
    activeTab === "WATCHLIST" ? watchlist.map((w) => w.symbol) : symbolsForMarket(activeTab);
  const { data: stocks = [], isLoading, isError } = useStockData(symbols, activeTab);
  const { toast } = useToast();

  // For watchlisted symbols outside the preset lists, the API can't know the
  // company name — fall back to the name captured at search time.
  const displayStocks = useMemo(() => {
    if (activeTab !== "WATCHLIST") return stocks;
    const names = Object.fromEntries(watchlist.map((w) => [w.symbol, w.name]));
    return stocks.map((s) => ({ ...s, name: names[s.symbol] ?? s.name }));
  }, [stocks, watchlist, activeTab]);

  // Auto-select the first stock when data arrives or the tab changes.
  useEffect(() => {
    if (stocks.length === 0) return;
    const stillThere = stocks.some((s) => s.symbol === selectedTicker);
    if (!selectedTicker || !stillThere) setTicker(stocks[0].symbol);
  }, [stocks, selectedTicker, setTicker]);

  useEffect(() => {
    if (isError) {
      toast({
        title: "Gagal memuat data saham",
        description: "Periksa koneksi atau coba lagi nanti.",
        variant: "error",
      });
    }
  }, [isError, toast]);

  const selected = displayStocks.find((s) => s.symbol === selectedTicker) ?? null;

  return (
    <div className="space-y-5">
      <MarketOverview />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Screener */}
        <div className="xl:col-span-4">
          <StockScreener stocks={displayStocks} isLoading={isLoading} />
        </div>

        {/* Chart + detail */}
        <div className="xl:col-span-5">
          <ChartCard stock={selected} isLoading={isLoading} />
        </div>

        {/* Forecast */}
        <div className="xl:col-span-3">
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-text">Analisis & Rekomendasi</h3>
            {selected ? (
              <ForecastPanel stock={selected} />
            ) : (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ stock, isLoading }: { stock: StockData | null; isLoading: boolean }) {
  if (!stock) {
    return (
      <Card>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-4 h-[240px] w-full" />
        <Skeleton className="mt-3 h-[85px] w-full" />
      </Card>
    );
  }

  const up = (stock.changePct ?? 0) >= 0;

  return (
    <Card>
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-base font-bold text-text">{stock.symbol.replace(".JK", "")}</span>
        <span className="text-xs text-muted">{stock.name}</span>
        <SignalBadge signal={stock.signal} className="ml-auto" />
      </div>
      <div className="mb-3 flex items-baseline gap-2">
        <span className="text-xl font-bold tabular-nums text-text">
          {formatPrice(stock.currentPrice, stock.currency)}
        </span>
        <span className={cn("text-sm font-medium", up ? "text-green" : "text-red")}>
          {formatPct(stock.changePct)}
        </span>
      </div>

      <PriceChart stock={stock} />

      <div className="mt-2">
        <p className="mb-1 text-[10px] uppercase tracking-wide text-muted">RSI (14)</p>
        <RSIChart stock={stock} />
      </div>

      <QuickStats symbol={stock.symbol} currency={stock.currency} fallbackLoading={isLoading} />

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted">
        <Legend color="var(--blue)" label="Harga" />
        <Legend color="var(--orange)" label="SMA20" />
        <Legend color="var(--purple)" label="SMA50" dashed />
      </div>
    </Card>
  );
}

function Legend({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="inline-block h-0.5 w-4"
        style={{
          background: dashed ? `repeating-linear-gradient(90deg, ${color} 0 4px, transparent 4px 8px)` : color,
        }}
      />
      {label}
    </span>
  );
}

function QuickStats({
  symbol,
  currency,
  fallbackLoading,
}: {
  symbol: string;
  currency: string;
  fallbackLoading: boolean;
}) {
  const { data, isLoading } = useQuery<StockQuote>({
    queryKey: ["quote", symbol],
    queryFn: async () => {
      const res = await fetch(`/api/quote?symbol=${symbol}`);
      if (!res.ok) throw new Error("quote failed");
      return res.json();
    },
    retry: 2,
    staleTime: 60_000,
  });

  const stats: Array<{ label: string; value: string }> = [
    { label: "Open", value: formatPrice(data?.open, currency) },
    { label: "High", value: formatPrice(data?.dayHigh, currency) },
    { label: "Low", value: formatPrice(data?.dayLow, currency) },
    { label: "Volume", value: formatCompact(data?.volume) },
    { label: "Market Cap", value: formatCompact(data?.marketCap) },
    { label: "P/E", value: data?.pe != null ? data.pe.toFixed(2) : "--" },
  ];

  const loading = isLoading || fallbackLoading;

  return (
    <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
      {stats.map((s) => (
        <div key={s.label} className="rounded-lg border border-border bg-surface-2 p-2 text-center">
          <p className="text-[10px] uppercase tracking-wide text-muted">{s.label}</p>
          {loading ? (
            <Skeleton className="mx-auto mt-1 h-3 w-12" />
          ) : (
            <p className="mt-0.5 truncate text-xs font-semibold text-text">{s.value}</p>
          )}
        </div>
      ))}
    </div>
  );
}
