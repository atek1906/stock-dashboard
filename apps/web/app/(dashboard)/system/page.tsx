"use client";

import { useMetricsStore } from "@/lib/store";
import { CHART_COLORS } from "@/components/charts/chart-theme";
import { Donut } from "@/components/charts/donut";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { Card, CardHeader, CardLabel, CardTitle } from "@/components/ui/card";
import { PageTitle } from "@/components/layout/page-title";
import { cn } from "@/lib/utils";

function coreColor(usage: number): string {
  if (usage > 90) return CHART_COLORS.critical;
  if (usage > 70) return CHART_COLORS.warning;
  return CHART_COLORS.healthy;
}

export default function SystemPage() {
  const system = useMetricsStore((s) => s.system);
  const vitals = useMetricsStore((s) => s.vitals);

  return (
    <div>
      <PageTitle title="System" subtitle="CPU, memory, disk, and network deep-dive" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Per-core heatmap */}
        <Card>
          <CardHeader>
            <CardTitle>CPU — Per-Core Utilization</CardTitle>
            <CardLabel>{system ? `${system.cpu.toFixed(0)}% avg` : "—"}</CardLabel>
          </CardHeader>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 lg:grid-cols-4 xl:grid-cols-8">
            {(system?.cores ?? []).map((c) => (
              <div key={c.core} className="flex flex-col items-center gap-1">
                <div className="flex h-24 w-full items-end overflow-hidden rounded bg-border/40">
                  <div
                    className="w-full rounded transition-all duration-500"
                    style={{ height: `${c.usage}%`, background: coreColor(c.usage) }}
                  />
                </div>
                <span className="text-[10px] text-text-secondary">c{c.core}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Memory breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Memory Breakdown</CardTitle>
            <CardLabel>{system ? `${system.memory.total} GB total` : "—"}</CardLabel>
          </CardHeader>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Donut
              height={180}
              centerLabel="used"
              centerValue={system ? `${system.memoryPct.toFixed(0)}%` : "—"}
              data={[
                { name: "Used", value: system?.memory.used ?? 0, color: CHART_COLORS.indigo },
                { name: "Buffers", value: system?.memory.buffers ?? 0, color: CHART_COLORS.cyan },
                { name: "Cached", value: system?.memory.cached ?? 0, color: CHART_COLORS.orange },
                { name: "Free", value: system?.memory.free ?? 0, color: "#475569" },
              ]}
            />
            <ul className="flex-1 space-y-2 text-sm">
              {[
                { label: "Used", v: system?.memory.used, c: CHART_COLORS.indigo },
                { label: "Buffers", v: system?.memory.buffers, c: CHART_COLORS.cyan },
                { label: "Cached", v: system?.memory.cached, c: CHART_COLORS.orange },
                { label: "Free", v: system?.memory.free, c: "#475569" },
              ].map((r) => (
                <li key={r.label} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-text-secondary">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.c }} />
                    {r.label}
                  </span>
                  <span className="font-medium text-text-primary">
                    {r.v !== undefined ? `${r.v} GB` : "—"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        {/* Disk usage + IOPS */}
        <Card>
          <CardHeader>
            <CardTitle>Disk Usage</CardTitle>
            <CardLabel>{system ? `${system.diskIops} IOPS` : "—"}</CardLabel>
          </CardHeader>
          <div className="space-y-3">
            {(system?.disk ?? []).map((d) => (
              <div key={d.mount}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-text-primary">{d.mount}</span>
                  <span className="text-text-secondary">
                    {d.usedPct.toFixed(0)}% of {d.totalGb} GB
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-border/50">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500")}
                    style={{
                      width: `${d.usedPct}%`,
                      background:
                        d.usedPct > 90
                          ? CHART_COLORS.critical
                          : d.usedPct > 75
                            ? CHART_COLORS.warning
                            : CHART_COLORS.healthy,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <CardLabel>IOPS</CardLabel>
            <TimeSeriesChart
              data={vitals}
              height={140}
              series={[{ key: "iops", name: "IOPS", color: CHART_COLORS.indigo }]}
            />
          </div>
        </Card>

        {/* Network */}
        <Card>
          <CardHeader>
            <CardTitle>Network I/O</CardTitle>
            <CardLabel>Mbps</CardLabel>
          </CardHeader>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-bg/40 p-3">
              <span className="label-caps">Total Down</span>
              <p className="text-lg font-bold text-chart-cyan">
                {system ? `${system.network.totalRxGb.toFixed(1)} GB` : "—"}
              </p>
            </div>
            <div className="rounded-lg bg-bg/40 p-3">
              <span className="label-caps">Total Up</span>
              <p className="text-lg font-bold text-chart-orange">
                {system ? `${system.network.totalTxGb.toFixed(1)} GB` : "—"}
              </p>
            </div>
          </div>
          <TimeSeriesChart
            data={vitals}
            type="area"
            height={180}
            series={[
              { key: "rx", name: "Download", color: CHART_COLORS.cyan },
              { key: "tx", name: "Upload", color: CHART_COLORS.orange },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
