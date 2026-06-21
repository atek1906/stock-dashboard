// Shared domain types for Stockwise.

export type SignalKind = "BUY" | "HOLD" | "SELL";

export type Market = "IHSG" | "NASDAQ";

/** Screener tabs: the two preset markets plus the user's saved watchlist. */
export type Tab = Market | "WATCHLIST";

/** A user-saved stock in the watchlist. */
export interface WatchItem {
  symbol: string;
  name: string;
}

/** A symbol-search hit returned by GET /api/search. */
export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

/** A single scoring factor surfaced in the forecast panel. */
export interface Factor {
  icon: string;
  text: string;
  /** true = bullish, false = bearish, null = neutral. */
  positive: boolean | null;
}

/** Output of the signal scoring engine. */
export interface Signal {
  signal: SignalKind;
  score: number;
  maxScore: number;
  factors: Factor[];
  rsi: number | null;
  sma20: number | null;
  sma50: number | null;
}

/** Per-stock payload returned by GET /api/stocks. */
export interface StockData {
  symbol: string;
  name: string;
  dates: string[]; // ISO yyyy-mm-dd
  prices: number[];
  sma20: (number | null)[];
  sma50: (number | null)[];
  rsi14: (number | null)[];
  currentPrice: number | null;
  changePct: number | null;
  currency: string;
  signal: SignalKind;
  signalScore: number;
  signalDetail: Signal;
}

/** A market index card payload returned by GET /api/market. */
export interface MarketIndex {
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  changePct: number | null;
  currency: string;
}

/** Single-symbol full quote returned by GET /api/quote. */
export interface StockQuote {
  symbol: string;
  name: string;
  price: number | null;
  previousClose: number | null;
  open: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  volume: number | null;
  marketCap: number | null;
  pe: number | null;
  week52High: number | null;
  week52Low: number | null;
  currency: string;
}
