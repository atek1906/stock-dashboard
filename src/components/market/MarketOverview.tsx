"use client";

import { useEffect } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useMarketData } from "@/hooks/useMarketData";
import { useToast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, formatPct } from "@/lib/format";
import { cn } from "@/lib/cn";

export function MarketOverview() {
  const { data, isLoading, isError } = useMarketData();
  const { toast } = useToast();

  useEffect(() => {
    if (isError) {
      toast({
        title: "Gagal memuat data pasar",
        description: "Coba beberapa saat lagi.",
        variant: "error",
      });
    }
  }, [isError, toast]);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {isLoading || !data
        ? Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-3 h-6 w-24" />
              <Skeleton className="mt-2 h-3 w-14" />
            </Card>
          ))
        : data.map((idx) => {
            const up = (idx.changePct ?? 0) >= 0;
            return (
              <Card key={idx.symbol}>
                <p className="text-xs font-medium uppercase tracking-wide text-muted">{idx.name}</p>
                <p className="mt-1.5 text-xl font-bold text-text">
                  {idx.price !== null ? formatNumber(idx.price, 2) : "--"}
                </p>
                <p
                  className={cn(
                    "mt-1 flex items-center gap-1 text-xs font-medium",
                    idx.changePct === null ? "text-muted" : up ? "text-green" : "text-red"
                  )}
                >
                  {idx.changePct !== null &&
                    (up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                  {formatPct(idx.changePct)}
                </p>
              </Card>
            );
          })}
    </div>
  );
}
