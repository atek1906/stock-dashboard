import { NextResponse } from "next/server";
import type { MarketIndex } from "@/types";
import { fetchIndexQuote } from "@/lib/yahoo";

// Always fetch fresh at request time (no build-time prerender of live data);
// the Cache-Control header below gives the CDN a 5-minute cache window.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const INDICES: Array<{ symbol: string; name: string }> = [
  { symbol: "^JKSE", name: "IHSG" },
  { symbol: "^IXIC", name: "NASDAQ" },
  { symbol: "IDR=X", name: "USD / IDR" },
  { symbol: "^VIX", name: "VIX" },
];

/**
 * GET /api/market
 * Returns the IHSG, NASDAQ Composite, USD/IDR, and VIX index cards.
 */
export async function GET() {
  const data = await Promise.all(
    INDICES.map(async ({ symbol, name }): Promise<MarketIndex> => {
      const q = await fetchIndexQuote(symbol);
      return {
        symbol,
        name,
        price: q?.price ?? null,
        change: q?.change ?? null,
        changePct: q?.changePct ?? null,
        currency: q?.currency ?? "USD",
      };
    })
  );

  return NextResponse.json(data, {
    headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" },
  });
}
