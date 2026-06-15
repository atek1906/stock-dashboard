"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AXIS_PROPS, formatTime, GRID_STROKE, TOOLTIP_STYLE } from "./chart-theme";

export interface SeriesConfig {
  key: string;
  name: string;
  color: string;
  /** Secondary Y axis id (e.g. network on a separate scale). */
  yAxisId?: string;
}

interface TimeSeriesChartProps {
  data: Array<Record<string, number>>;
  series: SeriesConfig[];
  type?: "line" | "area";
  height?: number;
  stacked?: boolean;
  /** Render a second Y axis on the right for series that set yAxisId="right". */
  rightAxis?: boolean;
  unit?: string;
}

/**
 * Generic time-series chart (line or area) keyed on a `ts` field. Used across
 * the dashboard for vitals, request rate, error rate, revenue, etc.
 */
export function TimeSeriesChart({
  data,
  series,
  type = "line",
  height = 240,
  stacked = false,
  rightAxis = false,
  unit,
}: TimeSeriesChartProps) {
  const ChartEl = type === "area" ? AreaChart : LineChart;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ChartEl data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="ts" tickFormatter={formatTime} minTickGap={48} {...AXIS_PROPS} />
        <YAxis yAxisId="left" width={48} unit={unit} {...AXIS_PROPS} />
        {rightAxis && <YAxis yAxisId="right" orientation="right" width={48} {...AXIS_PROPS} />}
        <Tooltip
          {...TOOLTIP_STYLE}
          labelFormatter={(ts) => formatTime(Number(ts))}
          isAnimationActive={false}
        />
        {series.map((s) =>
          type === "area" ? (
            <Area
              key={s.key}
              yAxisId={s.yAxisId ?? "left"}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              fill={`url(#grad-${s.key})`}
              stackId={stacked ? "stack" : undefined}
              isAnimationActive={false}
              dot={false}
            />
          ) : (
            <Line
              key={s.key}
              yAxisId={s.yAxisId ?? "left"}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              isAnimationActive={false}
              dot={false}
            />
          )
        )}
      </ChartEl>
    </ResponsiveContainer>
  );
}
