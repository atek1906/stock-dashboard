import { NextResponse } from "next/server";
import { createMetricsEngine } from "@/lib/metrics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const engine = createMetricsEngine();
  const event = engine.tick();
  return NextResponse.json({ ts: event.ts, business: event.business });
}
