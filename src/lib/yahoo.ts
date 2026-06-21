// Server-side Yahoo Finance helpers. Import only from API route handlers —
// never from client components.
import yahooFinance from "yahoo-finance2";
import type { SearchResult, StockQuote } from "@/types";

// Silence the one-time survey notice the library prints on first use.
try {
  yahooFinance.suppressNotices(["yahooSurvey"]);
} catch {
  // older/newer versions may not expose this; safe to ignore
}

// Yahoo rejects requests without a browser-like User-Agent with HTTP 429.
// Send one on every call. `validateResult: false` keeps minor schema drift
// from throwing.
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const MODULE_OPTS = {
  validateResult: false,
  fetchOptions: { headers: { "User-Agent": UA } },
} as const;

export type ChartRange = "1mo" | "3mo" | "6mo" | "1y" | "ytd";

export interface ChartSeries {
  symbol: string;
  dates: string[];
  prices: number[];
  currency: string;
}

function period1For(range: ChartRange): Date {
  const now = new Date();
  switch (range) {
    case "1mo":
      return new Date(now.getTime() - 31 * 864e5);
    case "3mo":
      return new Date(now.getTime() - 93 * 864e5);
    case "1y":
      return new Date(now.getTime() - 372 * 864e5);
    case "ytd":
      return new Date(now.getFullYear(), 0, 1);
    case "6mo":
    default:
      return new Date(now.getTime() - 186 * 864e5);
  }
}

/**
 * Daily close history for a symbol. Returns null on failure so a single bad
 * symbol never crashes a multi-symbol request.
 */
export async function fetchChart(symbol: string, range: ChartRange): Promise<ChartSeries | null> {
  try {
    const result = await yahooFinance.chart(
      symbol,
      { period1: period1For(range), interval: "1d" },
      MODULE_OPTS
    );
    type ChartQuote = { date?: Date | string | number; close?: number | null };
    const rawQuotes = (result?.quotes ?? []) as ChartQuote[];
    const quotes = rawQuotes.filter(
      (q): q is Required<Pick<ChartQuote, "date" | "close">> =>
        !!q && q.date != null && q.close != null
    );
    if (quotes.length === 0) return null;

    const dates = quotes.map((q) => new Date(q.date).toISOString().slice(0, 10));
    const prices = quotes.map((q) => Number(q.close));
    const currency = (result?.meta?.currency as string) ?? inferCurrency(symbol);
    return { symbol, dates, prices, currency };
  } catch (err) {
    console.warn(`[yahoo] chart failed for ${symbol}:`, (err as Error).message);
    return null;
  }
}

/** Full single-symbol quote. Returns null on failure. */
export async function fetchQuote(symbol: string): Promise<StockQuote | null> {
  try {
    const q = await yahooFinance.quote(symbol, {}, MODULE_OPTS);
    if (!q) return null;
    return {
      symbol,
      name: (q.longName as string) ?? (q.shortName as string) ?? symbol,
      price: numOrNull(q.regularMarketPrice),
      previousClose: numOrNull(q.regularMarketPreviousClose),
      open: numOrNull(q.regularMarketOpen),
      dayHigh: numOrNull(q.regularMarketDayHigh),
      dayLow: numOrNull(q.regularMarketDayLow),
      volume: numOrNull(q.regularMarketVolume),
      marketCap: numOrNull(q.marketCap),
      pe: numOrNull(q.trailingPE),
      week52High: numOrNull(q.fiftyTwoWeekHigh),
      week52Low: numOrNull(q.fiftyTwoWeekLow),
      currency: (q.currency as string) ?? inferCurrency(symbol),
    };
  } catch (err) {
    console.warn(`[yahoo] quote failed for ${symbol}:`, (err as Error).message);
    return null;
  }
}

export interface IndexQuote {
  symbol: string;
  price: number | null;
  change: number | null;
  changePct: number | null;
  currency: string;
}

/** Lightweight quote used for the market index cards. */
export async function fetchIndexQuote(symbol: string): Promise<IndexQuote | null> {
  try {
    const q = await yahooFinance.quote(symbol, {}, MODULE_OPTS);
    if (!q) return null;
    return {
      symbol,
      price: numOrNull(q.regularMarketPrice),
      change: numOrNull(q.regularMarketChange),
      changePct: numOrNull(q.regularMarketChangePercent),
      currency: (q.currency as string) ?? "USD",
    };
  } catch (err) {
    console.warn(`[yahoo] index quote failed for ${symbol}:`, (err as Error).message);
    return null;
  }
}

/** Symbol search by ticker or company name. Equities, ETFs, and indices. */
export async function searchSymbols(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    const res = await yahooFinance.search(q, {}, MODULE_OPTS);
    type SearchQuote = {
      symbol?: string;
      shortname?: string;
      longname?: string;
      exchDisp?: string;
      exchange?: string;
      quoteType?: string;
    };
    const quotes = ((res?.quotes ?? []) as SearchQuote[]).filter(
      (it) =>
        !!it.symbol &&
        ["EQUITY", "ETF", "INDEX", "MUTUALFUND", "CURRENCY"].includes(it.quoteType ?? "")
    );
    return quotes.slice(0, 8).map((it) => ({
      symbol: it.symbol as string,
      name: it.shortname ?? it.longname ?? (it.symbol as string),
      exchange: it.exchDisp ?? it.exchange ?? "",
      type: it.quoteType ?? "",
    }));
  } catch (err) {
    console.warn(`[yahoo] search failed for "${q}":`, (err as Error).message);
    return [];
  }
}

function numOrNull(v: unknown): number | null {
  return typeof v === "number" && !Number.isNaN(v) ? v : null;
}

function inferCurrency(symbol: string): string {
  return symbol.endsWith(".JK") ? "IDR" : "USD";
}
