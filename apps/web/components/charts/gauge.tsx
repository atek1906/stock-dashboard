"use client";

import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import { CHART_COLORS } from "./chart-theme";

interface GaugeProps {
  value: number; // 0-100
  /** Optional thresholds to color the arc by severity. */
  warning?: number;
  critical?: number;
  size?: number;
  label?: string;
}

function colorFor(value: number, warning?: number, critical?: number): string {
  if (critical !== undefined && value > critical) return CHART_COLORS.critical;
  if (warning !== undefined && value > warning) return CHART_COLORS.warning;
  return CHART_COLORS.healthy;
}

/** Single-value radial gauge (semi-circular fill) for percentage metrics. */
export function Gauge({ value, warning, critical, size = 140, label }: GaugeProps) {
  const color = colorFor(value, warning, critical);
  const data = [{ name: "value", value: Math.max(0, Math.min(100, value)) }];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="72%"
          outerRadius="100%"
          data={data}
          startAngle={220}
          endAngle={-40}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar
            background={{ fill: "hsl(var(--border))" }}
            dataKey="value"
            cornerRadius={9999}
            fill={color}
            isAnimationActive={false}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-text-primary">{value.toFixed(0)}%</span>
        {label && <span className="label-caps mt-0.5">{label}</span>}
      </div>
    </div>
  );
}
