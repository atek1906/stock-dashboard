// Shared chart constants. Status colors are fixed; surface colors reference
// the theme CSS variables so charts adapt to light/dark automatically.

export const CHART_COLORS = {
  indigo: "#6366f1",
  cyan: "#06b6d4",
  orange: "#f97316",
  healthy: "#22c55e",
  warning: "#f59e0b",
  critical: "#ef4444",
} as const;

export const AXIS_PROPS = {
  stroke: "hsl(var(--text-secondary))",
  tick: { fill: "hsl(var(--text-secondary))", fontSize: 11 },
  tickLine: false,
  axisLine: false,
} as const;

export const GRID_STROKE = "hsl(var(--border))";

export const TOOLTIP_STYLE = {
  contentStyle: {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 12,
    color: "hsl(var(--text-primary))",
    fontSize: 12,
  },
  labelStyle: { color: "hsl(var(--text-secondary))" },
  itemStyle: { color: "hsl(var(--text-primary))" },
} as const;

/** Format an epoch-ms timestamp as HH:mm for chart axes/tooltips. */
export function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
