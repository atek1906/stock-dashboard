import { describe, expect, it } from "vitest";
import {
  createMetricsEngine,
  evaluateAlerts,
  fbm,
  severityFor,
  THRESHOLDS,
  valueNoise,
} from "./metrics";

describe("valueNoise", () => {
  it("is deterministic for a given seed", () => {
    expect(valueNoise(3.5, 42)).toBe(valueNoise(3.5, 42));
  });

  it("differs across seeds", () => {
    expect(valueNoise(3.5, 1)).not.toBe(valueNoise(3.5, 2));
  });

  it("stays within [0, 1]", () => {
    for (let t = 0; t < 50; t += 0.37) {
      const v = valueNoise(t, 7);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it("is smooth — adjacent samples are close", () => {
    const a = valueNoise(10.0, 9);
    const b = valueNoise(10.01, 9);
    expect(Math.abs(a - b)).toBeLessThan(0.1);
  });
});

describe("fbm", () => {
  it("stays within [0, 1] across octaves", () => {
    for (let t = 0; t < 30; t += 0.5) {
      const v = fbm(t, 11, 4);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

describe("severityFor", () => {
  const rule = { warning: 70, critical: 90 };

  it("returns healthy below warning", () => {
    expect(severityFor(50, rule)).toBe("healthy");
    expect(severityFor(70, rule)).toBe("healthy"); // boundary is exclusive
  });

  it("returns warning between thresholds", () => {
    expect(severityFor(71, rule)).toBe("warning");
    expect(severityFor(90, rule)).toBe("warning");
  });

  it("returns critical above critical", () => {
    expect(severityFor(91, rule)).toBe("critical");
  });
});

describe("evaluateAlerts", () => {
  const ts = 1_700_000_000_000;

  it("returns no alerts when everything is healthy", () => {
    const alerts = evaluateAlerts(
      { cpu: 10, memoryPct: 30, errorRate: 0.1, p95: 100, diskPct: 40 },
      ts
    );
    expect(alerts).toEqual([]);
  });

  it("flags a warning when a metric crosses the warning threshold", () => {
    const alerts = evaluateAlerts(
      { cpu: 75, memoryPct: 30, errorRate: 0.1, p95: 100, diskPct: 40 },
      ts
    );
    expect(alerts).toHaveLength(1);
    expect(alerts[0].metric).toBe("CPU Usage");
    expect(alerts[0].severity).toBe("warning");
    expect(alerts[0].threshold).toBe(THRESHOLDS.cpu.warning);
    expect(alerts[0].id).toBe(`${ts}-cpu`);
  });

  it("flags critical and reports the critical threshold", () => {
    const alerts = evaluateAlerts(
      { cpu: 95, memoryPct: 30, errorRate: 0.1, p95: 100, diskPct: 40 },
      ts
    );
    expect(alerts[0].severity).toBe("critical");
    expect(alerts[0].threshold).toBe(THRESHOLDS.cpu.critical);
  });

  it("emits one alert per breached metric", () => {
    const alerts = evaluateAlerts(
      { cpu: 99, memoryPct: 99, errorRate: 9, p95: 3000, diskPct: 95 },
      ts
    );
    expect(alerts).toHaveLength(5);
    expect(alerts.every((a) => a.severity === "critical")).toBe(true);
  });

  it("includes the value and a descriptive message", () => {
    const [alert] = evaluateAlerts(
      { cpu: 10, memoryPct: 10, errorRate: 6, p95: 100, diskPct: 10 },
      ts
    );
    expect(alert.metric).toBe("Error Rate");
    expect(alert.value).toBe(6);
    expect(alert.message).toContain("Error Rate");
    expect(alert.message).toContain("critical");
  });
});

describe("createMetricsEngine", () => {
  it("produces a coherent StreamEvent within expected ranges", () => {
    const engine = createMetricsEngine({ seed: 1 });
    const e = engine.tick(1_700_000_000_000);

    expect(e.system.cpu).toBeGreaterThanOrEqual(0);
    expect(e.system.cpu).toBeLessThanOrEqual(100);
    expect(e.system.cores).toHaveLength(8);
    expect(e.system.memoryPct).toBeGreaterThanOrEqual(0);
    expect(e.system.memoryPct).toBeLessThanOrEqual(100);
    expect(e.system.disk.length).toBeGreaterThan(0);

    expect(e.api.requestsPerSec).toBeGreaterThanOrEqual(0);
    expect(e.api.latency.p99).toBeGreaterThanOrEqual(e.api.latency.p95);
    expect(e.api.latency.p95).toBeGreaterThanOrEqual(e.api.latency.p90);
    expect(e.api.latency.p90).toBeGreaterThanOrEqual(e.api.latency.p50);
    expect(e.api.uptimePct).toBeLessThanOrEqual(100);

    expect(e.business.funnel).toHaveLength(4);
    expect(e.business.revenueToday).toBeGreaterThan(0);
    expect(e.ts).toBe(1_700_000_000_000);
  });

  it("status code buckets sum to the request total", () => {
    const engine = createMetricsEngine({ seed: 3 });
    const e = engine.tick();
    const { s2xx, s3xx, s4xx, s5xx } = e.api.statusCodes;
    expect(s2xx + s3xx + s4xx + s5xx).toBe(e.api.requestsPerSec);
  });

  it("accumulates revenue across ticks", () => {
    const engine = createMetricsEngine({ seed: 5 });
    const first = engine.tick();
    let last = first.business.revenueToday;
    for (let i = 0; i < 20; i++) {
      const next = engine.tick();
      expect(next.business.revenueToday).toBeGreaterThanOrEqual(last);
      last = next.business.revenueToday;
    }
  });

  it("accumulates network totals monotonically", () => {
    const engine = createMetricsEngine({ seed: 8 });
    const a = engine.tick();
    const b = engine.tick();
    expect(b.system.network.totalRxGb).toBeGreaterThan(a.system.network.totalRxGb);
    expect(b.system.network.totalTxGb).toBeGreaterThan(a.system.network.totalTxGb);
  });

  it("is reproducible for the same seed", () => {
    const a = createMetricsEngine({ seed: 99 });
    const b = createMetricsEngine({ seed: 99 });
    const ea = a.tick(1000);
    const eb = b.tick(1000);
    expect(ea.system.cpu).toBe(eb.system.cpu);
    expect(ea.api.latency.p95).toBe(eb.api.latency.p95);
  });

  it("sorts endpoints slowest-first", () => {
    const engine = createMetricsEngine({ seed: 2 });
    const { endpoints } = engine.tick().api;
    for (let i = 1; i < endpoints.length; i++) {
      expect(endpoints[i - 1].avgMs).toBeGreaterThanOrEqual(endpoints[i].avgMs);
    }
  });
});
