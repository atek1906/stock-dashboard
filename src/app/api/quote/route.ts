import { NextResponse } from "next/server";
import { fetchQuote } from "@/lib/yahoo";

export const revalidate = 60;
export const runtime = "nodejs";

/**
 * GET /api/quote?symbol=BBCA.JK
 * Full single-symbol quote for the stock-detail strip.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get("symbol") ?? "").trim();

  if (!symbol) {
    return NextResponse.json({ error: "No symbol provided" }, { status: 400 });
  }

  const quote = await fetchQuote(symbol);
  if (!quote) {
    return NextResponse.json({ error: `No data for ${symbol}` }, { status: 404 });
  }

  return NextResponse.json(quote, {
    headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" },
  });
}
