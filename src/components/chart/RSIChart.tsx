"use client";

import { useMemo } from "react";
import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { StockData } from "@/types";

export function RSIChart({ stock }: { stock: StockData }) {
  const data = useMemo(
    () => stock.dates.map((date, i) => ({ date, rsi: stock.rsi14[i] })),
    [stock]
  );

  return (
    <ResponsiveContainer width="100%" height={85}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
        <XAxis dataKey="date" hide />
        <YAxis
          domain={[0, 100]}
          ticks={[30, 50, 70]}
          width={56}
          tick={{ fill: "var(--muted)", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <ReferenceLine y={70} stroke="var(--red)" strokeDasharray="4 4" />
        <ReferenceLine y={30} stroke="var(--green)" strokeDasharray="4 4" />
        <Tooltip
          isAnimationActive={false}
          contentStyle={{
            background: "#1c2128",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "var(--muted)" }}
          formatter={(v: number) => [v?.toFixed(1), "RSI"]}
        />
        <Line
          type="monotone"
          dataKey="rsi"
          name="RSI"
          stroke="var(--green)"
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
