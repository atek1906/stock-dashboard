import { beforeEach, describe, expect, it } from "vitest";
import type { Alert, StreamEvent } from "@monitoring/types";
import { MAX_POINTS, useAlertStore, useMetricsStore, useUIStore } from "./store";
import { createMetricsEngine } from "./metrics";

function sampleEvent(ts = Date.now()): StreamEvent {
  return createMetricsEngine({ seed: 1 }).tick(ts);
}

function alert(id: string, ts = 1000): Alert {
  return {
    id,
    ts,
    metric: "CPU Usage",
    severity: "warning",
    value: 80,
    threshold: 70,
    message: "test",
  };
}

beforeEach(() => {
  useMetricsStore.setState({
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
  });
  useAlertStore.setState({ alerts: [], unread: 0 });
  useUIStore.setState({ sidebarCollapsed: false, mobileNavOpen: false, timeRange: "60m" });
});

describe("metrics store", () => {
  it("ingests an event into latest + rolling series", () => {
    const e = sampleEvent(5000);
    useMetricsStore.getState().ingest(e);
    const s = useMetricsStore.getState();
    expect(s.lastUpdated).toBe(5000);
    expect(s.system?.cpu).toBe(e.system.cpu);
    expect(s.vitals).toHaveLength(1);
    expect(s.apiSeries[0]).toMatchObject({ rps: e.api.requestsPerSec });
    expect(s.businessSeries[0].revenue).toBe(e.business.revenueToday);
  });

  it("computes ingest latency as the gap between ticks", () => {
    const ingest = useMetricsStore.getState().ingest;
    ingest(sampleEvent(1000));
    ingest(sampleEvent(3000));
    expect(useMetricsStore.getState().latency).toBe(2000);
  });

  it("caps rolling windows at MAX_POINTS", () => {
    const ingest = useMetricsStore.getState().ingest;
    for (let i = 0; i < MAX_POINTS + 25; i++) ingest(sampleEvent(i));
    const { vitals } = useMetricsStore.getState();
    expect(vitals).toHaveLength(MAX_POINTS);
    // Oldest points were dropped; the last point is the most recent ts.
    expect(vitals[vitals.length - 1].ts).toBe(MAX_POINTS + 24);
  });

  it("updates connection state", () => {
    useMetricsStore.getState().setConnection("connected");
    expect(useMetricsStore.getState().connection).toBe("connected");
  });
});

describe("alert store", () => {
  it("adds alerts and increments unread", () => {
    useAlertStore.getState().addAlerts([alert("a"), alert("b")]);
    expect(useAlertStore.getState().alerts).toHaveLength(2);
    expect(useAlertStore.getState().unread).toBe(2);
  });

  it("dedupes by id", () => {
    useAlertStore.getState().addAlerts([alert("a")]);
    useAlertStore.getState().addAlerts([alert("a")]);
    expect(useAlertStore.getState().alerts).toHaveLength(1);
    expect(useAlertStore.getState().unread).toBe(1);
  });

  it("ignores empty batches", () => {
    useAlertStore.getState().addAlerts([]);
    expect(useAlertStore.getState().alerts).toHaveLength(0);
  });

  it("caps the list at 20 newest-first", () => {
    const batch = Array.from({ length: 25 }, (_, i) => alert(`id-${i}`, i));
    useAlertStore.getState().addAlerts(batch);
    const { alerts } = useAlertStore.getState();
    expect(alerts).toHaveLength(20);
    // Newest (highest index) is first.
    expect(alerts[0].id).toBe("id-0");
  });

  it("marks all read and clears", () => {
    useAlertStore.getState().addAlerts([alert("a")]);
    useAlertStore.getState().markAllRead();
    expect(useAlertStore.getState().unread).toBe(0);
    useAlertStore.getState().clear();
    expect(useAlertStore.getState().alerts).toHaveLength(0);
  });
});

describe("ui store", () => {
  it("toggles the sidebar", () => {
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
  });

  it("toggles and closes mobile nav", () => {
    useUIStore.getState().toggleMobileNav();
    expect(useUIStore.getState().mobileNavOpen).toBe(true);
    useUIStore.getState().closeMobileNav();
    expect(useUIStore.getState().mobileNavOpen).toBe(false);
  });

  it("sets the time range", () => {
    useUIStore.getState().setTimeRange("15m");
    expect(useUIStore.getState().timeRange).toBe("15m");
  });
});
