"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AXIS_PROPS, GRID_STROKE, TOOLTIP_STYLE } from "./chart-theme";
import type { SeriesConfig } from "./time-series-chart";

interface BarSeriesChartProps {
  data: Array<Record<string, number | string>>;
  bars: SeriesConfig[];
  xKey: string;
  height?: number;
  stacked?: boolean;
  /** Optional overlay line on a right axis (e.g. conversion rate). */
  line?: SeriesConfig;
}

/** Bar chart with optional stacking and an optional overlaid line series. */
export function BarSeriesChart({
  data,
  bars,
  xKey,
  height = 240,
  stacked = false,
  line,
}: BarSeriesChartProps) {
  const Chart = line ? ComposedChart : BarChart;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <Chart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xKey} minTickGap={16} {...AXIS_PROPS} />
        <YAxis yAxisId="left" width={48} {...AXIS_PROPS} />
        {line && <YAxis yAxisId="right" orientation="right" width={40} {...AXIS_PROPS} />}
        <Tooltip
          {...TOOLTIP_STYLE}
          isAnimationActive={false}
          cursor={{ fill: "hsl(var(--border) / 0.3)" }}
        />
        {bars.map((b) => (
          <Bar
            key={b.key}
            yAxisId="left"
            dataKey={b.key}
            name={b.name}
            fill={b.color}
            stackId={stacked ? "stack" : undefined}
            radius={stacked ? 0 : [4, 4, 0, 0]}
            isAnimationActive={false}
          />
        ))}
        {line && (
          <Line
            yAxisId="right"
            type="monotone"
            dataKey={line.key}
            name={line.name}
            stroke={line.color}
            strokeWidth={2}
            isAnimationActive={false}
            dot={false}
          />
        )}
      </Chart>
    </ResponsiveContainer>
  );
}
