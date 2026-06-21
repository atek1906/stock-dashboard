import { NextResponse } from "next/server";
import type { StockData } from "@/types";
import { calcRSI, calcSMA } from "@/lib/indicators";
import { generateSignal } from "@/lib/signals";
import { fetchChart, type ChartRange } from "@/lib/yahoo";
import { nameForSymbol } from "@/lib/stocks";

export const revalidate = 300;
export const runtime = "nodejs";
// Fetching many symbols can exceed the 10s Hobby default; allow more headroom.
export const maxDuration = 30;

const VALID_RANGES: ChartRange[] = ["1mo", "3mo", "6mo", "1y", "ytd"];

/**
 * GET /api/stocks?symbols=BBCA.JK,AAPL&range=6mo
 *
 * Fetches daily history for each symbol, computes SMA20/SMA50/RSI14 and a
 * BUY/HOLD/SELL signal, and returns a StockData[] (failed symbols are skipped).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get("symbols") ?? "";
  const rangeParam = (searchParams.get("range") ?? "6mo") as ChartRange;
  const range = VALID_RANGES.includes(rangeParam) ? rangeParam : "6mo";

  const symbols = symbolsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (symbols.length === 0) {
    return NextResponse.json({ error: "No symbols provided" }, { status: 400 });
  }

  const results = await Promise.all(
    symbols.map(async (symbol): Promise<StockData | null> => {
      const chart = await fetchChart(symbol, range);
      if (!chart || chart.prices.length === 0) return null;

      const { dates, prices, currency } = chart;
      const sma20 = calcSMA(prices, 20);
      const sma50 = calcSMA(prices, 50);
      const rsi14 = calcRSI(prices, 14);
      const detail = generateSignal(prices, sma20, sma50, rsi14);

      const currentPrice = prices[prices.length - 1] ?? null;
      const prevClose = prices.length >= 2 ? prices[prices.length - 2] : null;
      const changePct =
        currentPrice !== null && prevClose !== null && prevClose !== 0
          ? ((currentPrice - prevClose) / prevClose) * 100
          : null;

      return {
        symbol,
        name: nameForSymbol(symbol),
        dates,
        prices,
        sma20,
        sma50,
        rsi14,
        currentPrice,
        changePct,
        currency,
        signal: detail.signal,
        signalScore: detail.score,
        signalDetail: detail,
      };
    })
  );

  const stocks = results.filter((s): s is StockData => s !== null);

  return NextResponse.json(stocks, {
    headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" },
  });
}
