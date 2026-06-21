import type { Market } from "@/types";

export interface StockListItem {
  symbol: string;
  name: string;
}

// IHSG (Indonesia Stock Exchange) — Yahoo uses the .JK suffix.
export const IHSG_STOCKS: StockListItem[] = [
  { symbol: "BBCA.JK", name: "Bank Central Asia" },
  { symbol: "BBRI.JK", name: "Bank Rakyat Indonesia" },
  { symbol: "BMRI.JK", name: "Bank Mandiri" },
  { symbol: "TLKM.JK", name: "Telkom Indonesia" },
  { symbol: "ASII.JK", name: "Astra International" },
  { symbol: "GOTO.JK", name: "GoTo Gojek Tokopedia" },
  { symbol: "ADRO.JK", name: "Adaro Energy" },
  { symbol: "INDF.JK", name: "Indofood Sukses Makmur" },
  { symbol: "PGAS.JK", name: "Perusahaan Gas Negara" },
  { symbol: "ICBP.JK", name: "Indofood CBP Sukses Makmur" },
];

// NASDAQ.
export const NASDAQ_STOCKS: StockListItem[] = [
  { symbol: "NVDA", name: "NVIDIA Corporation" },
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "MSFT", name: "Microsoft Corporation" },
  { symbol: "GOOGL", name: "Alphabet Inc." },
  { symbol: "AMZN", name: "Amazon.com Inc." },
  { symbol: "META", name: "Meta Platforms Inc." },
  { symbol: "TSLA", name: "Tesla Inc." },
  { symbol: "AMD", name: "Advanced Micro Devices" },
  { symbol: "AVGO", name: "Broadcom Inc." },
  { symbol: "PLTR", name: "Palantir Technologies" },
];

export const STOCK_LISTS: Record<Market, StockListItem[]> = {
  IHSG: IHSG_STOCKS,
  NASDAQ: NASDAQ_STOCKS,
};

const NAME_BY_SYMBOL: Record<string, string> = [...IHSG_STOCKS, ...NASDAQ_STOCKS].reduce(
  (acc, s) => {
    acc[s.symbol] = s.name;
    return acc;
  },
  {} as Record<string, string>
);

export function nameForSymbol(symbol: string): string {
  return NAME_BY_SYMBOL[symbol] ?? symbol;
}

export function symbolsForMarket(market: Market): string[] {
  return STOCK_LISTS[market].map((s) => s.symbol);
}
