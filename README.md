# 📈 Stockwise

A real-time **stock screener and technical-analysis dashboard** for **IHSG**
(Indonesia Stock Exchange) and **NASDAQ** stocks. Dark, GitHub-themed trading UI
with market index cards, a BUY/HOLD/SELL screener, an interactive price chart
with SMA overlays, an RSI panel, and a rule-based forecast/recommendation engine.

```
┌────────────────────────────────────────────────────────────┐
│ 📈 Stockwise · IHSG & NASDAQ Forecaster   ● Live · every 5m  │
├──────────────┬───────────────────────────┬──────────────────┤
│  Screener    │  Price + SMA20/SMA50       │  Signal: BELI    │
│  BBCA  BELI  │  RSI(14)                   │  Skor: +4 / 8    │
│  BBRI  TAHAN │  Open/High/Low/Vol/Cap/PE  │  Faktor analisis │
└──────────────┴───────────────────────────┴──────────────────┘
```

---

## Tech stack

| Area        | Choice                                          |
| ----------- | ----------------------------------------------- |
| Framework   | Next.js 14 (App Router, TypeScript)             |
| Styling     | Tailwind CSS + shadcn-style primitives          |
| Charts      | Recharts                                        |
| Market data | Yahoo Finance via `yahoo-finance2` (server-only) |
| State       | Zustand                                         |
| Data fetch  | TanStack Query (auto-refresh every 5 min)       |
| Tests       | Jest + Testing Library                          |
| Deploy      | Vercel                                          |
| CI/CD       | GitHub Actions                                  |

---

## Prerequisites

- **Node 20+**
- **pnpm 9** (`corepack enable` ships it with Node)

---

## Quickstart

```bash
pnpm install
cp .env.local.example .env.local   # optional — sensible defaults exist
pnpm dev
```

Open <http://localhost:3000>. Market data and the IHSG screener load on first
paint; everything auto-refreshes every 5 minutes.

> **Network note:** `yahoo-finance2` calls Yahoo's public endpoints at request
> time. The app needs outbound internet to show live data; without it, cards and
> tables degrade gracefully to `--`.

### Scripts

```bash
pnpm dev          # dev server
pnpm build        # production build
pnpm start        # serve the production build
pnpm lint         # eslint (next/core-web-vitals)
pnpm typecheck    # tsc --noEmit
pnpm test         # jest unit tests (indicators + signal engine)
pnpm format       # prettier --write
```

---

## Architecture

```
Browser ──React Query (5-min refetch)──▶ /api/market   ─┐
        ──React Query (5-min refetch)──▶ /api/stocks    ├─ yahoo-finance2 ──▶ Yahoo Finance
        ──on stock select────────────▶ /api/quote     ─┘   (server-side only)

src/lib/indicators.ts   calcSMA · calcRSI (Wilder) · calcMACD
src/lib/signals.ts      6-factor scoring → BUY / HOLD / SELL
```

All indicator math and signal scoring run **server-side** inside the API routes;
the client only renders cached results. Routes set `Cache-Control: s-maxage=300`
so Vercel's CDN caches responses for 5 minutes.

### API routes

| Route                                          | Returns                                            |
| ---------------------------------------------- | -------------------------------------------------- |
| `GET /api/market`                              | IHSG, NASDAQ, USD/IDR, VIX index cards             |
| `GET /api/stocks?symbols=BBCA.JK,AAPL&range=6mo` | `StockData[]` with SMA/RSI series + signal       |
| `GET /api/quote?symbol=BBCA.JK`                | Full single-stock quote (OHLC, volume, cap, P/E)   |

### Signal engine

Six factors, total range −8…+8:

| # | Factor              | Weight                                        |
| - | ------------------- | --------------------------------------------- |
| 1 | Price vs SMA20      | ±1                                            |
| 2 | Price vs SMA50      | ±2                                            |
| 3 | SMA20 vs SMA50      | ±1 (golden/death cross)                       |
| 4 | RSI level           | +3 oversold / −3 overbought / +1 recovering   |
| 5 | RSI momentum (5d)   | ±1                                            |
| 6 | Price momentum (5d) | ±1                                            |

`score ≥ 3 → BUY` · `score ≤ −2 → SELL` · otherwise `HOLD`.

---

## Environment variables

| Variable                  | Default                | Purpose                              |
| ------------------------- | ---------------------- | ------------------------------------ |
| `NEXT_PUBLIC_APP_NAME`    | `Stockwise`            | App name.                            |
| `NEXT_PUBLIC_REFRESH_MS`  | `300000`               | Client auto-refresh interval (ms).   |
| `DATA_REVALIDATE_SECONDS` | `300`                  | Server cache window (s).             |

No API key is required — `yahoo-finance2` fetches anonymously.

---

## Deployment (Vercel)

`deploy.yml` builds and deploys `main` to Vercel on every push. Add these repo
secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

---

## Notes

- The spec lists `next.config.ts`; Next.js 14 only reads JS config, so this repo
  uses **`next.config.mjs`** (the `.ts` config form arrives in Next 15). This is
  the single intentional deviation from the requested file list.

---

## License

MIT
