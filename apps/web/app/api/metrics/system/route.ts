import { NextResponse } from "next/server";
import { createMetricsEngine } from "@/lib/metrics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Snapshot endpoint used by the Docker/CI healthcheck and ad-hoc polling.
export async function GET() {
  const engine = createMetricsEngine();
  const event = engine.tick();
  return NextResponse.json({ ts: event.ts, system: event.system });
}
