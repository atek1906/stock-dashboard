"use client";

import { useMemo } from "react";
import { parseISO, format } from "date-fns";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { StockData } from "@/types";
import { formatPrice } from "@/lib/format";

function fmtDate(iso: string): string {
  try {
    return format(parseISO(iso), "dd MMM");
  } catch {
    return iso;
  }
}

interface RowDatum {
  date: string;
  price: number;
  sma20: number | null;
  sma50: number | null;
}

function ChartTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number | null; color: string }>;
  label?: string;
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-[#1c2128] p-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-muted">{label ? fmtDate(label) : ""}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2" style={{ color: p.color }}>
          <span>{p.name}</span>
          <span className="ml-auto tabular-nums text-text">{formatPrice(p.value, currency)}</span>
        </p>
      ))}
    </div>
  );
}

export function PriceChart({ stock }: { stock: StockData }) {
  const data = useMemo<RowDatum[]>(
    () =>
      stock.dates.map((date, i) => ({
        date,
        price: stock.prices[i],
        sma20: stock.sma20[i],
        sma50: stock.sma50[i],
      })),
    [stock]
  );

  const interval = Math.max(0, Math.floor(data.length / 7) - 1);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={fmtDate}
          interval={interval}
          tick={{ fill: "var(--muted)", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={["auto", "auto"]}
          width={56}
          tickFormatter={(v) => formatPrice(v, stock.currency)}
          tick={{ fill: "var(--muted)", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<ChartTooltip currency={stock.currency} />} isAnimationActive={false} />
        <Line
          type="monotone"
          dataKey="price"
          name="Harga"
          stroke="var(--blue)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="sma20"
          name="SMA20"
          stroke="var(--orange)"
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="sma50"
          name="SMA50"
          stroke="var(--purple)"
          strokeWidth={1.5}
          strokeDasharray="5 4"
          dot={false}
          isAnimationActive={false}
          connectNulls
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
