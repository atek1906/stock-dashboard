"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ArrowUpDown } from "lucide-react";
import type { EndpointStat } from "@monitoring/types";
import { useAlertStore, useMetricsStore } from "@/lib/store";
import { CHART_COLORS } from "@/components/charts/chart-theme";
import { BarSeriesChart } from "@/components/charts/bar-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardLabel, CardTitle } from "@/components/ui/card";
import { PageTitle } from "@/components/layout/page-title";
import { cn } from "@/lib/utils";

type SortKey = keyof Pick<EndpointStat, "avgMs" | "reqCount" | "errorPct">;

export default function ApiHealthPage() {
  const api = useMetricsStore((s) => s.api);
  const apiSeries = useMetricsStore((s) => s.apiSeries);
  const alerts = useAlertStore((s) => s.alerts);
  const [sortKey, setSortKey] = useState<SortKey>("avgMs");

  const endpoints = [...(api?.endpoints ?? [])].sort((a, b) => b[sortKey] - a[sortKey]);
  const uptime = api?.uptimePct ?? 0;
  const slaOk = uptime >= 99.9;
  const incidents = alerts.filter((a) => a.severity === "critical").slice(0, 8);

  const percentiles: Array<[string, number | undefined]> = [
    ["P50", api?.latency.p50],
    ["P90", api?.latency.p90],
    ["P95", api?.latency.p95],
    ["P99", api?.latency.p99],
  ];

  return (
    <div>
      <PageTitle title="API Health" subtitle="Uptime, latency, status codes, and endpoints" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Uptime */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle>Uptime</CardTitle>
            <Badge variant={slaOk ? "healthy" : "warning"}>{slaOk ? "SLA met" : "At risk"}</Badge>
          </CardHeader>
          <p className="text-[40px] font-bold leading-none text-text-primary">
            {uptime.toFixed(3)}%
          </p>
          <p className="mt-2 text-sm text-text-secondary">
            {api ? `${api.requestsPerSec} req/s · ${api.errorRate.toFixed(2)}% errors` : "—"}
          </p>
        </Card>

        {/* Latency percentiles */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Latency Percentiles</CardTitle>
            <CardLabel>updates live</CardLabel>
          </CardHeader>
          <div className="grid grid-cols-4 gap-3">
            {percentiles.map(([label, v]) => (
              <div key={label} className="rounded-lg bg-bg/40 p-3 text-center">
                <span className="label-caps">{label}</span>
                <p
                  className={cn(
                    "mt-1 text-2xl font-bold",
                    (v ?? 0) > 2000
                      ? "text-critical"
                      : (v ?? 0) > 500
                        ? "text-warning"
                        : "text-text-primary"
                  )}
                >
                  {v !== undefined ? `${v}` : "—"}
                  <span className="text-sm font-normal text-text-secondary"> ms</span>
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Status code distribution */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Status Code Distribution</CardTitle>
            <CardLabel>last 30 min</CardLabel>
          </CardHeader>
          <BarSeriesChart
            data={apiSeries.slice(-90)}
            xKey="ts"
            stacked
            height={240}
            bars={[
              { key: "s2xx", name: "2xx", color: CHART_COLORS.healthy },
              { key: "s3xx", name: "3xx", color: CHART_COLORS.cyan },
              { key: "s4xx", name: "4xx", color: CHART_COLORS.warning },
              { key: "s5xx", name: "5xx", color: CHART_COLORS.critical },
            ]}
          />
        </Card>

        {/* Incident log */}
        <Card>
          <CardHeader>
            <CardTitle>Incident Log</CardTitle>
            <CardLabel>critical only</CardLabel>
          </CardHeader>
          <div className="scroll-thin max-h-[240px] space-y-2 overflow-y-auto pr-1">
            {incidents.length === 0 ? (
              <p className="py-8 text-center text-sm text-text-secondary">No incidents</p>
            ) : (
              incidents.map((a) => (
                <div key={a.id} className="border-l-2 border-critical pl-3">
                  <p className="text-sm font-medium text-text-primary">{a.metric}</p>
                  <p className="text-xs text-text-secondary">
                    {format(a.ts, "HH:mm:ss")} · {a.value} vs {a.threshold}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Slowest endpoints */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Slowest Endpoints</CardTitle>
            <CardLabel>click a header to sort</CardLabel>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-text-secondary">
                  <th className="py-2 pr-3 font-medium">Endpoint</th>
                  {(
                    [
                      ["avgMs", "Avg ms"],
                      ["reqCount", "Requests"],
                      ["errorPct", "Error %"],
                    ] as Array<[SortKey, string]>
                  ).map(([key, label]) => (
                    <th key={key} className="py-2 pr-3 font-medium">
                      <button
                        onClick={() => setSortKey(key)}
                        className={cn(
                          "inline-flex items-center gap-1 hover:text-text-primary",
                          sortKey === key && "text-text-primary"
                        )}
                      >
                        {label}
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {endpoints.map((e) => (
                  <tr key={e.endpoint} className="border-b border-border/50">
                    <td className="py-2 pr-3 font-mono text-xs text-text-primary">{e.endpoint}</td>
                    <td
                      className={cn(
                        "py-2 pr-3",
                        e.avgMs > 2000
                          ? "text-critical"
                          : e.avgMs > 500
                            ? "text-warning"
                            : "text-text-primary"
                      )}
                    >
                      {e.avgMs}
                    </td>
                    <td className="py-2 pr-3 text-text-secondary">{e.reqCount}</td>
                    <td className="py-2 pr-3 text-text-secondary">{e.errorPct.toFixed(2)}%</td>
                  </tr>
                ))}
                {endpoints.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-text-secondary">
                      Waiting for data…
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
