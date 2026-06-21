"use client";

import { ArrowDown, ArrowUp, X } from "lucide-react";
import type { StockData } from "@/types";
import { SignalBadge } from "./SignalBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, formatPct } from "@/lib/format";
import { cn } from "@/lib/cn";

interface StockTableProps {
  stocks: StockData[];
  isLoading: boolean;
  selectedTicker: string | null;
  onSelect: (symbol: string) => void;
  /** When provided, each row shows a remove control (used by the watchlist). */
  onRemove?: (symbol: string) => void;
}

export function StockTable({
  stocks,
  isLoading,
  selectedTicker,
  onSelect,
  onRemove,
}: StockTableProps) {
  return (
    <div>
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-surface">
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
            <th className="px-3 py-1.5 font-medium">Saham</th>
            <th className="px-3 py-1.5 text-right font-medium">Harga</th>
            <th className="px-3 py-1.5 text-right font-medium">%</th>
            <th className="px-3 py-1.5 text-right font-medium">Sinyal</th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="border-b border-border/60">
                  <td className="px-3 py-1.5">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="mt-1 h-2.5 w-28" />
                  </td>
                  <td className="px-3 py-1.5">
                    <Skeleton className="ml-auto h-3 w-14" />
                  </td>
                  <td className="px-3 py-1.5">
                    <Skeleton className="ml-auto h-3 w-10" />
                  </td>
                  <td className="px-3 py-1.5">
                    <Skeleton className="ml-auto h-4 w-12" />
                  </td>
                </tr>
              ))
            : stocks.map((s) => {
                const active = s.symbol === selectedTicker;
                const up = (s.changePct ?? 0) >= 0;
                return (
                  <tr
                    key={s.symbol}
                    onClick={() => onSelect(s.symbol)}
                    className={cn(
                      "cursor-pointer border-b border-border/60 transition-colors",
                      active ? "bg-blue/10" : "hover:bg-surface-2"
                    )}
                  >
                    <td className="px-3 py-1.5">
                      <div className="flex items-center gap-1.5">
                        {onRemove && (
                          <button
                            aria-label={`Hapus ${s.symbol} dari watchlist`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemove(s.symbol);
                            }}
                            className="text-muted hover:text-red"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <span className="font-semibold text-text">{s.symbol.replace(".JK", "")}</span>
                      </div>
                      <div className="truncate text-[11px] leading-tight text-muted">{s.name}</div>
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-text">
                      {formatPrice(s.currentPrice, s.currency)}
                    </td>
                    <td
                      className={cn(
                        "px-3 py-1.5 text-right tabular-nums",
                        s.changePct === null ? "text-muted" : up ? "text-green" : "text-red"
                      )}
                    >
                      <span className="inline-flex items-center justify-end gap-0.5">
                        {s.changePct !== null &&
                          (up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                        {formatPct(s.changePct)}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <SignalBadge signal={s.signal} />
                    </td>
                  </tr>
                );
              })}
          {!isLoading && stocks.length === 0 && (
            <tr>
              <td colSpan={4} className="px-3 py-10 text-center text-muted">
                Tidak ada data tersedia
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
