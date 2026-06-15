"use client";

import { useEffect, useRef } from "react";
import type { StreamEvent } from "@monitoring/types";
import { useAlertStore, useMetricsStore } from "./store";

const SSE_PATH = process.env.NEXT_PUBLIC_SSE_PATH ?? "/api/stream";
const MAX_BACKOFF_MS = 30_000;
// Even if the stream pushes faster than this, we only commit to React state
// once per FLUSH_MS to avoid re-render storms.
const FLUSH_MS = 1_000;

/**
 * Subscribes to the server SSE stream and feeds the Zustand stores.
 *
 * - Opens an EventSource on mount, tears it down on unmount.
 * - Reconnects automatically with exponential backoff capped at 30s.
 * - Buffers incoming events and flushes the latest to the store at most once
 *   per second.
 * - Tracks connection state: connected | reconnecting | disconnected.
 *
 * Intended to be mounted exactly once (in the root layout shell).
 */
export function useMetricsStream(): void {
  const ingest = useMetricsStore((s) => s.ingest);
  const setConnection = useMetricsStore((s) => s.setConnection);
  const addAlerts = useAlertStore((s) => s.addAlerts);

  // Stable refs so the effect runs once and never re-subscribes.
  const ingestRef = useRef(ingest);
  const setConnectionRef = useRef(setConnection);
  const addAlertsRef = useRef(addAlerts);
  ingestRef.current = ingest;
  setConnectionRef.current = setConnection;
  addAlertsRef.current = addAlerts;

  useEffect(() => {
    let source: EventSource | null = null;
    let backoff = 1_000;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let flushTimer: ReturnType<typeof setInterval> | null = null;
    let pending: StreamEvent | null = null;
    let closed = false;

    const flush = () => {
      if (!pending) return;
      const event = pending;
      pending = null;
      ingestRef.current(event);
      if (event.alerts.length) addAlertsRef.current(event.alerts);
    };

    const connect = () => {
      if (closed) return;
      setConnectionRef.current("reconnecting");
      source = new EventSource(SSE_PATH);

      source.onopen = () => {
        backoff = 1_000; // reset backoff on a healthy connection
        setConnectionRef.current("connected");
      };

      source.onmessage = (e) => {
        try {
          pending = JSON.parse(e.data) as StreamEvent;
        } catch {
          // Ignore malformed frames; the next tick will recover.
        }
      };

      source.onerror = () => {
        // EventSource auto-retries, but we control backoff explicitly for a
        // predictable, capped reconnect cadence and accurate UI state.
        source?.close();
        source = null;
        setConnectionRef.current("disconnected");
        if (closed) return;
        reconnectTimer = setTimeout(connect, backoff);
        backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
      };
    };

    flushTimer = setInterval(flush, FLUSH_MS);
    connect();

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (flushTimer) clearInterval(flushTimer);
      source?.close();
    };
  }, []);
}
