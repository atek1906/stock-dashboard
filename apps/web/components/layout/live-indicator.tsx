"use client";

import { useMetricsStore } from "@/lib/store";
import { cn } from "@/lib/utils";

// Latency above this (ms) between ingests downgrades the dot to "degraded".
const HIGH_LATENCY_MS = 4000;

export function LiveIndicator() {
  const connection = useMetricsStore((s) => s.connection);
  const latency = useMetricsStore((s) => s.latency);

  const degraded = latency !== null && latency > HIGH_LATENCY_MS;

  const { color, label, pulse } =
    connection === "connected"
      ? degraded
        ? { color: "bg-warning", label: "Degraded", pulse: true }
        : { color: "bg-healthy", label: "Live", pulse: true }
      : connection === "reconnecting"
        ? { color: "bg-warning", label: "Reconnecting", pulse: true }
        : { color: "bg-critical", label: "Disconnected", pulse: false };

  return (
    <div className="flex items-center gap-2" aria-live="polite" data-testid="live-indicator">
      <span className="relative flex h-2.5 w-2.5">
        {pulse && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-75",
              color,
              "animate-pulse-dot"
            )}
          />
        )}
        <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", color)} />
      </span>
      <span className="text-xs font-medium text-text-secondary">{label}</span>
    </div>
  );
}
