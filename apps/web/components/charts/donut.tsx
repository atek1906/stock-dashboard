"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { TOOLTIP_STYLE } from "./chart-theme";

export interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

interface DonutProps {
  data: DonutSlice[];
  height?: number;
  unit?: string;
  centerLabel?: string;
  centerValue?: string;
}

/** Donut/breakdown chart with an optional center label. */
export function Donut({ data, height = 200, centerLabel, centerValue }: DonutProps) {
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="100%"
            paddingAngle={2}
            stroke="none"
            isAnimationActive={false}
          >
            {data.map((slice) => (
              <Cell key={slice.name} fill={slice.color} />
            ))}
          </Pie>
          <Tooltip {...TOOLTIP_STYLE} isAnimationActive={false} />
        </PieChart>
      </ResponsiveContainer>
      {(centerLabel || centerValue) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {centerValue && (
            <span className="text-xl font-bold text-text-primary">{centerValue}</span>
          )}
          {centerLabel && <span className="label-caps mt-0.5">{centerLabel}</span>}
        </div>
      )}
    </div>
  );
}
