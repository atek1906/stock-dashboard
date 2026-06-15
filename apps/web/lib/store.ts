import { create } from "zustand";
import type {
  Alert,
  ApiMetrics,
  BusinessMetrics,
  ConnectionState,
  StreamEvent,
  SystemMetrics,
} from "@monitoring/types";

// Max points retained per rolling series. Keeping a hard cap avoids unbounded
// growth and the re-render cost of ever-larger arrays.
export const MAX_POINTS = 500;

function pushCapped<T>(arr: T[], item: T, max = MAX_POINTS): T[] {
  const next = arr.length >= max ? arr.slice(arr.length - max + 1) : arr.slice();
  next.push(item);
  return next;
}

// ---------------------------------------------------------------------------
// Time-series point shapes consumed by charts
// ---------------------------------------------------------------------------

// These are chart series rows; the string index signature lets them satisfy
// the generic chart-component prop types (Record<string, number>) directly.
export type VitalsPoint = {
  ts: number;
  cpu: number;
  memory: number;
  network: number; // rx + tx Mbps
  rx: number;
  tx: number;
  iops: number;
  [key: string]: number;
};

export type ApiPoint = {
  ts: number;
  rps: number;
  errorRate: number;
  p95: number;
  s2xx: number;
  s3xx: number;
  s4xx: number;
  s5xx: number;
  [key: string]: number;
};

export type BusinessPoint = {
  ts: number;
  revenue: number;
  activeUsers: number;
  conversion: number;
  [key: string]: number;
};

// ---------------------------------------------------------------------------
// Metrics store: latest snapshot + rolling windows + connection state
// ---------------------------------------------------------------------------

interface MetricsState {
  connection: ConnectionState;
  lastUpdated: number | null;
  latency: number | null; // observed ingest gap (ms), drives the live dot color
  latest: StreamEvent | null;
  system: SystemMetrics | null;
  api: ApiMetrics | null;
  business: BusinessMetrics | null;
  vitals: VitalsPoint[];
  apiSeries: ApiPoint[];
  businessSeries: BusinessPoint[];
  setConnection: (c: ConnectionState) => void;
  ingest: (event: StreamEvent) => void;
}

export const useMetricsStore = create<MetricsState>((set, get) => ({
  connection: "reconnecting",
  lastUpdated: null,
  latency: null,
  latest: null,
  system: null,
  api: null,
  business: null,
  vitals: [],
  apiSeries: [],
  businessSeries: [],
  setConnection: (connection) => set({ connection }),
  ingest: (event) => {
    const prev = get().lastUpdated;
    set((s) => ({
      latest: event,
      lastUpdated: event.ts,
      latency: prev ? event.ts - prev : null,
      system: event.system,
      api: event.api,
      business: event.business,
      vitals: pushCapped(s.vitals, {
        ts: event.ts,
        cpu: event.system.cpu,
        memory: event.system.memoryPct,
        network: Math.round(event.system.network.rxMbps + event.system.network.txMbps),
        rx: event.system.network.rxMbps,
        tx: event.system.network.txMbps,
        iops: event.system.diskIops,
      }),
      apiSeries: pushCapped(s.apiSeries, {
        ts: event.ts,
        rps: event.api.requestsPerSec,
        errorRate: event.api.errorRate,
        p95: event.api.latency.p95,
        s2xx: event.api.statusCodes.s2xx,
        s3xx: event.api.statusCodes.s3xx,
        s4xx: event.api.statusCodes.s4xx,
        s5xx: event.api.statusCodes.s5xx,
      }),
      businessSeries: pushCapped(s.businessSeries, {
        ts: event.ts,
        revenue: event.business.revenueToday,
        activeUsers: event.business.activeUsers,
        conversion: event.business.conversionPct,
      }),
    }));
  },
}));

// ---------------------------------------------------------------------------
// Alert store: dedup'd list (last 20) + unread count
// ---------------------------------------------------------------------------

const MAX_ALERTS = 20;

interface AlertState {
  alerts: Alert[];
  unread: number;
  addAlerts: (alerts: Alert[]) => void;
  markAllRead: () => void;
  clear: () => void;
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: [],
  unread: 0,
  addAlerts: (incoming) => {
    if (incoming.length === 0) return;
    const existing = new Set(get().alerts.map((a) => a.id));
    const fresh = incoming.filter((a) => !existing.has(a.id));
    if (fresh.length === 0) return;
    set((s) => ({
      alerts: [...fresh, ...s.alerts].slice(0, MAX_ALERTS),
      unread: s.unread + fresh.length,
    }));
  },
  markAllRead: () => set({ unread: 0 }),
  clear: () => set({ alerts: [], unread: 0 }),
}));

// ---------------------------------------------------------------------------
// UI store: sidebar, theme delegation, time range
// ---------------------------------------------------------------------------

export type TimeRange = "15m" | "60m" | "all";

interface UIState {
  sidebarCollapsed: boolean; // desktop: 240px vs 64px rail
  mobileNavOpen: boolean; // mobile: slide-over drawer
  timeRange: TimeRange;
  toggleSidebar: () => void;
  toggleMobileNav: () => void;
  closeMobileNav: () => void;
  setTimeRange: (r: TimeRange) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  mobileNavOpen: false,
  timeRange: "60m",
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleMobileNav: () => set((s) => ({ mobileNavOpen: !s.mobileNavOpen })),
  closeMobileNav: () => set({ mobileNavOpen: false }),
  setTimeRange: (timeRange) => set({ timeRange }),
}));
