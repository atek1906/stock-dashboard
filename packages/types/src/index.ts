// Shared TypeScript contracts for the monitoring dashboard.
// Consumed by both the SSE server route and the React client.

export type Severity = "healthy" | "warning" | "critical";

export type ConnectionState = "connected" | "reconnecting" | "disconnected";

// ---------------------------------------------------------------------------
// System health
// ---------------------------------------------------------------------------

export interface CoreLoad {
  core: number;
  usage: number; // 0-100
}

export interface MemoryBreakdown {
  used: number; // GB
  buffers: number; // GB
  cached: number; // GB
  free: number; // GB
  total: number; // GB
}

export interface DiskMount {
  mount: string;
  usedPct: number; // 0-100
  totalGb: number;
}

export interface NetworkIO {
  rxMbps: number; // download
  txMbps: number; // upload
  totalRxGb: number; // cumulative
  totalTxGb: number; // cumulative
}

export interface SystemMetrics {
  cpu: number; // aggregate 0-100
  cores: CoreLoad[];
  memoryPct: number; // 0-100
  memory: MemoryBreakdown;
  disk: DiskMount[];
  diskPct: number; // worst mount, 0-100
  diskIops: number;
  network: NetworkIO;
}

// ---------------------------------------------------------------------------
// API / application performance
// ---------------------------------------------------------------------------

export interface LatencyPercentiles {
  p50: number;
  p90: number;
  p95: number;
  p99: number;
}

export interface StatusCodeBreakdown {
  s2xx: number;
  s3xx: number;
  s4xx: number;
  s5xx: number;
}

export interface EndpointStat {
  endpoint: string;
  avgMs: number;
  reqCount: number;
  errorPct: number;
}

export interface ApiMetrics {
  requestsPerSec: number;
  errorRate: number; // percentage 0-100
  latency: LatencyPercentiles;
  uptimePct: number; // 0-100
  statusCodes: StatusCodeBreakdown;
  endpoints: EndpointStat[];
}

// ---------------------------------------------------------------------------
// Business KPIs
// ---------------------------------------------------------------------------

export interface FunnelStage {
  stage: string;
  count: number;
}

export interface BusinessMetrics {
  revenueToday: number; // cumulative $
  revenueYesterday: number;
  revenue7dAvg: number;
  activeUsers: number;
  ordersThisHour: number;
  conversionPct: number; // 0-100
  funnel: FunnelStage[];
}

// ---------------------------------------------------------------------------
// Alerting
// ---------------------------------------------------------------------------

export interface Alert {
  id: string;
  ts: number;
  metric: string;
  severity: Exclude<Severity, "healthy">;
  value: number;
  threshold: number;
  message: string;
}

// ---------------------------------------------------------------------------
// Stream envelope
// ---------------------------------------------------------------------------

export interface StreamEvent {
  ts: number;
  system: SystemMetrics;
  api: ApiMetrics;
  business: BusinessMetrics;
  alerts: Alert[];
}
