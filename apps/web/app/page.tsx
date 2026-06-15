"use client";

import { useMetricsStore } from "@/lib/store";
import { CHART_COLORS } from "@/components/charts/chart-theme";
import { Gauge } from "@/components/charts/gauge";
import { Sparkline } from "@/components/charts/sparkline";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { Card, CardHeader, CardLabel, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/widgets/stat-card";
import { AlertFeed } from "@/components/widgets/alert-feed";
import { PageTitle } from "@/components/layout/page-title";
import { formatCurrency } from "@/lib/utils";

export default function OverviewPage() {
  const system = useMetricsStore((s) => s.system);
  const api = useMetricsStore((s) => s.api);
  const business = useMetricsStore((s) => s.business);
  const vitals = useMetricsStore((s) => s.vitals);
  const apiSeries = useMetricsStore((s) => s.apiSeries);
  const businessSeries = useMetricsStore((s) => s.businessSeries);

  const revenueDelta =
    business && business.revenue7dAvg
      ? ((business.revenueToday - business.revenue7dAvg) / business.revenue7dAvg) * 100
      : undefined;

  return (
    <div>
      <PageTitle title="Overview" subtitle="Live system, API, and business metrics" />

      {/* Summary row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="CPU Usage" value={system ? `${system.cpu.toFixed(0)}%` : "—"}>
          <div className="flex justify-center">
            <Gauge value={system?.cpu ?? 0} warning={70} critical={90} size={120} />
          </div>
        </StatCard>

        <StatCard label="Memory Usage" value={system ? `${system.memoryPct.toFixed(0)}%` : "—"}>
          <div className="flex justify-center">
            <Gauge value={system?.memoryPct ?? 0} warning={80} critical={95} size={120} />
          </div>
        </StatCard>

        <StatCard label="API P95 Latency" value={api ? `${api.latency.p95} ms` : "—"}>
          <Sparkline data={apiSeries} dataKey="p95" color={CHART_COLORS.cyan} height={84} />
        </StatCard>

        <StatCard
          label="Revenue Today"
          value={business ? formatCurrency(business.revenueToday) : "—"}
          delta={revenueDelta}
        >
          <Sparkline
            data={businessSeries}
            dataKey="revenue"
            color={CHART_COLORS.healthy}
            height={84}
          />
        </StatCard>
      </div>

      {/* Main grid */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>System Vitals</CardTitle>
              <CardLabel>60-min window</CardLabel>
            </CardHeader>
            <TimeSeriesChart
              data={vitals}
              type="area"
              height={280}
              rightAxis
              series={[
                { key: "cpu", name: "CPU %", color: CHART_COLORS.indigo },
                { key: "memory", name: "Memory %", color: CHART_COLORS.cyan },
                {
                  key: "network",
                  name: "Network Mbps",
                  color: CHART_COLORS.orange,
                  yAxisId: "right",
                },
              ]}
            />
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Requests / sec</CardTitle>
                <CardLabel>15-min</CardLabel>
              </CardHeader>
              <TimeSeriesChart
                data={apiSeries}
                height={200}
                series={[{ key: "rps", name: "Requests/s", color: CHART_COLORS.indigo }]}
              />
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Rate %</CardTitle>
                <CardLabel>15-min</CardLabel>
              </CardHeader>
              <TimeSeriesChart
                data={apiSeries}
                type="area"
                height={200}
                series={[{ key: "errorRate", name: "Error %", color: CHART_COLORS.critical }]}
              />
            </Card>
          </div>
        </div>

        <div className="xl:col-span-4">
          <AlertFeed />
        </div>
      </div>
    </div>
  );
}
