import type {
  Alert,
  ApiMetrics,
  BusinessMetrics,
  StreamEvent,
  SystemMetrics,
} from "@monitoring/types";

// ===========================================================================
// Deterministic value noise
// ---------------------------------------------------------------------------
// We want metrics that look organic (smooth, coherent) rather than jittery
// random. A seeded value-noise function gives us smooth 1-D curves that are
// fully reproducible for a given seed — important for stable tests and for
// "non-random-looking" data across SSE ticks.
// ===========================================================================

/** Deterministic hash of an integer step into [0, 1). */
function hash(n: number, seed: number): number {
  let x = (n * 374761393 + seed * 668265263) >>> 0;
  x = (x ^ (x >>> 13)) >>> 0;
  x = (x * 1274126177) >>> 0;
  return (x >>> 0) / 4294967296;
}

/** Smoothstep easing for interpolation between integer samples. */
function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/**
 * Smooth 1-D value noise in [0, 1]. `t` advances continuously; nearby `t`
 * values produce nearby outputs, giving Perlin-like organic motion.
 */
export function valueNoise(t: number, seed: number): number {
  const i = Math.floor(t);
  const f = t - i;
  const a = hash(i, seed);
  const b = hash(i + 1, seed);
  return a + (b - a) * smoothstep(f);
}

/** Layered octaves of value noise for richer variation, normalized to [0,1]. */
export function fbm(t: number, seed: number, octaves = 3): number {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * valueNoise(t * freq, seed + o * 101);
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function round(v: number, dp = 2): number {
  const m = 10 ** dp;
  return Math.round(v * m) / m;
}

// ===========================================================================
// Thresholds & alert evaluation (pure, unit-tested)
// ===========================================================================

export interface ThresholdRule {
  warning: number;
  critical: number;
}

export const THRESHOLDS = {
  cpu: { warning: 70, critical: 90 },
  memory: { warning: 80, critical: 95 },
  errorRate: { warning: 1, critical: 5 },
  p95Latency: { warning: 500, critical: 2000 },
  disk: { warning: 75, critical: 90 },
} as const satisfies Record<string, ThresholdRule>;

/** Returns the severity of a value against a rule (higher = worse). */
export function severityFor(
  value: number,
  rule: ThresholdRule
): "healthy" | "warning" | "critical" {
  if (value > rule.critical) return "critical";
  if (value > rule.warning) return "warning";
  return "healthy";
}

interface AlertableSnapshot {
  cpu: number;
  memoryPct: number;
  errorRate: number;
  p95: number;
  diskPct: number;
}

/**
 * Pure alert evaluation. Given the relevant metric values and a timestamp,
 * returns one alert per breached threshold (warning or critical). IDs are
 * derived from the timestamp + metric so they are stable for a given tick.
 */
export function evaluateAlerts(snap: AlertableSnapshot, ts: number): Alert[] {
  const checks: Array<{
    key: string;
    metric: string;
    value: number;
    rule: ThresholdRule;
    unit: string;
  }> = [
    { key: "cpu", metric: "CPU Usage", value: snap.cpu, rule: THRESHOLDS.cpu, unit: "%" },
    {
      key: "memory",
      metric: "Memory Usage",
      value: snap.memoryPct,
      rule: THRESHOLDS.memory,
      unit: "%",
    },
    {
      key: "error",
      metric: "Error Rate",
      value: snap.errorRate,
      rule: THRESHOLDS.errorRate,
      unit: "%",
    },
    {
      key: "latency",
      metric: "P95 Latency",
      value: snap.p95,
      rule: THRESHOLDS.p95Latency,
      unit: "ms",
    },
    { key: "disk", metric: "Disk Usage", value: snap.diskPct, rule: THRESHOLDS.disk, unit: "%" },
  ];

  const alerts: Alert[] = [];
  for (const c of checks) {
    const sev = severityFor(c.value, c.rule);
    if (sev === "healthy") continue;
    const threshold = sev === "critical" ? c.rule.critical : c.rule.warning;
    alerts.push({
      id: `${ts}-${c.key}`,
      ts,
      metric: c.metric,
      severity: sev,
      value: round(c.value, 1),
      threshold,
      message: `${c.metric} at ${round(c.value, 1)}${c.unit} exceeded ${sev} threshold of ${threshold}${c.unit}`,
    });
  }
  return alerts;
}

// ===========================================================================
// Metrics engine
// ---------------------------------------------------------------------------
// A stateful engine that produces a coherent StreamEvent per tick. Cumulative
// values (revenue, bytes transferred) accumulate across ticks; instantaneous
// values are driven by noise so successive ticks form smooth curves.
// ===========================================================================

const CORE_COUNT = 8;
const ENDPOINTS = [
  "GET /api/metrics",
  "POST /api/orders",
  "GET /api/users",
  "GET /api/products",
  "POST /api/checkout",
  "GET /api/search",
];

export interface MetricsEngineOptions {
  seed?: number;
  /** Tick interval in ms, used to scale cumulative accumulation. */
  intervalMs?: number;
}

export interface MetricsEngine {
  /** Produce the next event. `now` defaults to Date.now(). */
  tick(now?: number): StreamEvent;
}

/** Log-normal-ish latency sample driven by noise, with occasional spikes. */
function latencyBase(t: number, seed: number): number {
  const n = fbm(t, seed, 3); // 0..1
  // Base p50 ~ 40-160ms via exponential mapping.
  const base = 40 * Math.exp(n * 1.4);
  // Occasional spike when a separate slow-noise channel crosses a threshold.
  const spikeGate = valueNoise(t * 0.35, seed + 777);
  const spike = spikeGate > 0.88 ? (spikeGate - 0.88) * 9000 : 0;
  return base + spike;
}

export function createMetricsEngine(opts: MetricsEngineOptions = {}): MetricsEngine {
  const seed = opts.seed ?? 1337;
  const intervalMs = opts.intervalMs ?? 2000;
  const intervalSec = intervalMs / 1000;

  // Cumulative state.
  let revenueToday = 18_500; // seeded mid-day starting point
  let totalRxGb = 1240;
  let totalTxGb = 880;
  // Memory drifts slowly and drops on simulated GC events.
  let memoryPct = 62;

  let step = 0;

  function tick(now: number = Date.now()): StreamEvent {
    step += 1;
    const t = step * 0.12; // noise time base

    // ---- System ---------------------------------------------------------
    const cpu = clamp(20 + fbm(t, seed, 4) * 70, 0, 100);
    const cores = Array.from({ length: CORE_COUNT }, (_, i) => ({
      core: i,
      usage: round(clamp(cpu + (valueNoise(t * 1.7, seed + i * 31) - 0.5) * 40, 2, 100), 1),
    }));

    // Memory: slow drift up, periodic GC drop.
    const drift = (fbm(t * 0.25, seed + 5, 2) - 0.5) * 1.2;
    memoryPct = clamp(memoryPct + drift, 35, 99);
    const gcGate = valueNoise(t * 0.2, seed + 909);
    if (gcGate > 0.9) memoryPct = clamp(memoryPct - 12, 35, 99);
    const totalGb = 32;
    const usedGb = round((memoryPct / 100) * totalGb, 1);
    const buffers = round(totalGb * 0.06, 1);
    const cached = round(totalGb * 0.18, 1);
    const free = round(Math.max(0, totalGb - usedGb - buffers - cached), 1);

    const disk: SystemMetrics["disk"] = [
      {
        mount: "/",
        usedPct: round(clamp(58 + fbm(t * 0.1, seed + 11, 2) * 20, 0, 100), 1),
        totalGb: 256,
      },
      {
        mount: "/data",
        usedPct: round(clamp(72 + fbm(t * 0.08, seed + 12, 2) * 22, 0, 100), 1),
        totalGb: 1024,
      },
      {
        mount: "/var",
        usedPct: round(clamp(40 + fbm(t * 0.13, seed + 13, 2) * 18, 0, 100), 1),
        totalGb: 128,
      },
    ];
    const diskPct = Math.max(...disk.map((d) => d.usedPct));
    const diskIops = Math.round(clamp(200 + fbm(t * 0.9, seed + 21, 3) * 4800, 0, 6000));

    const rxMbps = round(clamp(40 + fbm(t * 1.1, seed + 31, 3) * 920, 0, 1000), 1);
    const txMbps = round(clamp(20 + fbm(t * 1.3, seed + 41, 3) * 480, 0, 600), 1);
    totalRxGb = round(totalRxGb + (rxMbps / 8 / 1024) * intervalSec, 3);
    totalTxGb = round(totalTxGb + (txMbps / 8 / 1024) * intervalSec, 3);

    const system: SystemMetrics = {
      cpu: round(cpu, 1),
      cores,
      memoryPct: round(memoryPct, 1),
      memory: { used: usedGb, buffers, cached, free, total: totalGb },
      disk,
      diskPct,
      diskIops,
      network: { rxMbps, txMbps, totalRxGb, totalTxGb },
    };

    // ---- API ------------------------------------------------------------
    const requestsPerSec = round(clamp(800 + fbm(t * 0.8, seed + 51, 3) * 2600, 0, 4000), 0);
    const p50 = round(latencyBase(t, seed + 61), 0);
    const p90 = round(p50 * (1.6 + fbm(t, seed + 62, 2) * 0.6), 0);
    const p95 = round(p90 * (1.25 + fbm(t, seed + 63, 2) * 0.5), 0);
    const p99 = round(p95 * (1.4 + fbm(t, seed + 64, 2) * 0.8), 0);

    // Error rate: usually low, rises with latency spikes.
    const errBase = fbm(t * 0.6, seed + 71, 3);
    const errorRate = round(clamp(errBase * 1.4 + (p95 > 2000 ? 4 : 0), 0, 12), 2);

    const total = requestsPerSec;
    const s5xx = Math.round((errorRate / 100) * total);
    const s4xx = Math.round(total * (0.02 + fbm(t, seed + 81, 2) * 0.04));
    const s3xx = Math.round(total * 0.05);
    const s2xx = Math.max(0, total - s5xx - s4xx - s3xx);

    const uptimePct = round(clamp(99.9 - errorRate * 0.05, 95, 100), 3);

    const endpoints: ApiMetrics["endpoints"] = ENDPOINTS.map((endpoint, i) => ({
      endpoint,
      avgMs: round(clamp(p50 * (0.6 + valueNoise(t * 1.2, seed + 90 + i) * 1.8), 5, 9000), 0),
      reqCount: Math.round(clamp(total * (0.05 + valueNoise(t, seed + 110 + i) * 0.25), 1, 4000)),
      errorPct: round(clamp(errorRate * (0.3 + valueNoise(t, seed + 130 + i) * 1.6), 0, 20), 2),
    })).sort((a, b) => b.avgMs - a.avgMs);

    const api: ApiMetrics = {
      requestsPerSec,
      errorRate,
      latency: { p50, p90, p95, p99 },
      uptimePct,
      statusCodes: { s2xx, s3xx, s4xx, s5xx },
      endpoints,
    };

    // ---- Business -------------------------------------------------------
    const orderRate = fbm(t * 0.7, seed + 141, 3); // 0..1
    const newOrders = Math.round(orderRate * 6);
    const avgOrderValue = 45 + valueNoise(t, seed + 151) * 180;
    revenueToday = round(revenueToday + newOrders * avgOrderValue, 2);
    const activeUsers = Math.round(clamp(1800 + fbm(t * 0.5, seed + 161, 3) * 4200, 0, 8000));
    const ordersThisHour = Math.round(clamp(120 + fbm(t * 0.4, seed + 171, 2) * 260, 0, 600));
    const conversionPct = round(clamp(1.5 + fbm(t * 0.3, seed + 181, 2) * 4, 0, 12), 2);

    const visits = activeUsers;
    const funnel: BusinessMetrics["funnel"] = [
      { stage: "Visits", count: visits },
      { stage: "Signups", count: Math.round(visits * 0.42) },
      { stage: "Checkout", count: Math.round(visits * 0.18) },
      { stage: "Paid", count: Math.round(visits * (conversionPct / 100)) },
    ];

    const business: BusinessMetrics = {
      revenueToday,
      revenueYesterday: 41_280,
      revenue7dAvg: 38_910,
      activeUsers,
      ordersThisHour,
      conversionPct,
      funnel,
    };

    // ---- Alerts ---------------------------------------------------------
    const alerts = evaluateAlerts(
      { cpu: system.cpu, memoryPct: system.memoryPct, errorRate, p95, diskPct },
      now
    );

    return { ts: now, system, api, business, alerts };
  }

  return { tick };
}
