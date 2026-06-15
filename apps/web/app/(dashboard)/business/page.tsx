"use client";

import { useMemo } from "react";
import { useMetricsStore } from "@/lib/store";
import { CHART_COLORS } from "@/components/charts/chart-theme";
import { BarSeriesChart } from "@/components/charts/bar-chart";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { Card, CardHeader, CardLabel, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/widgets/stat-card";
import { PageTitle } from "@/components/layout/page-title";
import { formatCompact, formatCurrency } from "@/lib/utils";

// Daily order shape (relative weight per hour) — low overnight, midday peak.
const HOURLY_WEIGHTS = [
  0.3, 0.2, 0.15, 0.12, 0.15, 0.25, 0.45, 0.7, 0.9, 1.0, 1.05, 1.1, 1.15, 1.05, 0.95, 0.9, 0.95,
  1.0, 1.05, 0.95, 0.8, 0.65, 0.5, 0.4,
];

export default function BusinessPage() {
  const business = useMetricsStore((s) => s.business);
  const series = useMetricsStore((s) => s.businessSeries);

  const revenueData = useMemo(
    () =>
      series.map((p) => ({
        ts: p.ts,
        revenue: p.revenue,
        yesterday: business?.revenueYesterday ?? 0,
        avg7d: business?.revenue7dAvg ?? 0,
      })),
    [series, business?.revenueYesterday, business?.revenue7dAvg]
  );

  // Synthesize a 24h hourly orders curve; the current hour reflects live data.
  const ordersData = useMemo(() => {
    const currentHour = new Date().getHours();
    const base = business?.ordersThisHour ?? 200;
    const conv = business?.conversionPct ?? 3;
    return HOURLY_WEIGHTS.map((w, h) => ({
      hour: `${String(h).padStart(2, "0")}:00`,
      orders: h === currentHour ? base : Math.round(base * w * (0.8 + (h % 3) * 0.07)),
      conversion: Number((conv * (0.7 + w * 0.4)).toFixed(2)),
    }));
  }, [business?.ordersThisHour, business?.conversionPct]);

  const funnel = business?.funnel ?? [];
  const funnelMax = funnel.length ? funnel[0].count : 1;

  return (
    <div>
      <PageTitle title="Business" subtitle="Revenue, users, orders, and conversion" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue Today"
          value={business ? formatCurrency(business.revenueToday) : "—"}
        />
        <StatCard
          label="Active Users"
          value={business ? formatCompact(business.activeUsers) : "—"}
        />
        <StatCard label="Orders / hour" value={business ? `${business.ordersThisHour}` : "—"} />
        <StatCard
          label="Conversion"
          value={business ? `${business.conversionPct.toFixed(2)}%` : "—"}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
            <CardLabel>today vs yesterday vs 7-day avg</CardLabel>
          </CardHeader>
          <TimeSeriesChart
            data={revenueData}
            height={240}
            series={[
              { key: "revenue", name: "Today", color: CHART_COLORS.healthy },
              { key: "yesterday", name: "Yesterday", color: CHART_COLORS.cyan },
              { key: "avg7d", name: "7-day avg", color: CHART_COLORS.orange },
            ]}
          />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Users</CardTitle>
            <CardLabel>real-time</CardLabel>
          </CardHeader>
          <TimeSeriesChart
            data={series}
            type="area"
            height={240}
            series={[{ key: "activeUsers", name: "Active users", color: CHART_COLORS.indigo }]}
          />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <CardLabel>hourly, last 24h · conversion overlay</CardLabel>
          </CardHeader>
          <BarSeriesChart
            data={ordersData}
            xKey="hour"
            height={240}
            bars={[{ key: "orders", name: "Orders", color: CHART_COLORS.indigo }]}
            line={{ key: "conversion", name: "Conversion %", color: CHART_COLORS.orange }}
          />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardLabel>visits → paid</CardLabel>
          </CardHeader>
          <div className="space-y-3 py-2">
            {funnel.map((stage, i) => {
              const pct = (stage.count / funnelMax) * 100;
              const colors = [
                CHART_COLORS.indigo,
                CHART_COLORS.cyan,
                CHART_COLORS.orange,
                CHART_COLORS.healthy,
              ];
              return (
                <div key={stage.stage}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-text-primary">{stage.stage}</span>
                    <span className="text-text-secondary">
                      {formatCompact(stage.count)}
                      {i > 0 && funnel[0].count > 0 && (
                        <span className="ml-2 text-xs">
                          ({((stage.count / funnel[0].count) * 100).toFixed(0)}%)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="h-7 w-full overflow-hidden rounded-md bg-border/40">
                    <div
                      className="flex h-full items-center justify-end rounded-md px-2 text-xs font-medium text-white transition-all duration-500"
                      style={{
                        width: `${Math.max(pct, 6)}%`,
                        background: colors[i % colors.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {funnel.length === 0 && (
              <p className="py-8 text-center text-sm text-text-secondary">Waiting for data…</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
