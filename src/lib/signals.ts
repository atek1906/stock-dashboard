import type { Factor, Signal, SignalKind } from "@/types";
import { lastValue } from "./indicators";

const MAX_SCORE = 8;

function pctChange(now: number, then: number): number {
  if (then === 0) return 0;
  return ((now - then) / then) * 100;
}

/**
 * Scores a stock across six technical factors and maps the total to a
 * BUY / HOLD / SELL signal.
 *
 * Factor weights:
 *   1. Price vs SMA20      ±1
 *   2. Price vs SMA50      ±2
 *   3. SMA20 vs SMA50      ±1
 *   4. RSI level           +3 oversold / -3 overbought / +1 recovering / 0 neutral
 *   5. RSI momentum (5d)   ±1
 *   6. Price momentum (5d) ±1
 *
 * Thresholds: score >= 3 → BUY, score <= -2 → SELL, otherwise HOLD.
 */
export function generateSignal(
  prices: number[],
  sma20Series: (number | null)[],
  sma50Series: (number | null)[],
  rsiSeries: (number | null)[]
): Signal {
  const price = prices.length ? prices[prices.length - 1] : null;
  const sma20 = lastValue(sma20Series);
  const sma50 = lastValue(sma50Series);
  const rsi = lastValue(rsiSeries);

  const factors: Factor[] = [];
  let score = 0;

  // 1. Price vs SMA20 (±1)
  if (price !== null && sma20 !== null) {
    if (price > sma20) {
      score += 1;
      factors.push({ icon: "📈", text: "Harga di atas SMA20", positive: true });
    } else {
      score -= 1;
      factors.push({ icon: "📉", text: "Harga di bawah SMA20", positive: false });
    }
  } else {
    factors.push({ icon: "➖", text: "SMA20 belum tersedia", positive: null });
  }

  // 2. Price vs SMA50 (±2)
  if (price !== null && sma50 !== null) {
    if (price > sma50) {
      score += 2;
      factors.push({ icon: "🟢", text: "Harga di atas SMA50 (tren naik)", positive: true });
    } else {
      score -= 2;
      factors.push({ icon: "🔻", text: "Harga di bawah SMA50 (tren turun)", positive: false });
    }
  } else {
    factors.push({ icon: "➖", text: "SMA50 belum tersedia", positive: null });
  }

  // 3. SMA20 vs SMA50 (±1)
  if (sma20 !== null && sma50 !== null) {
    if (sma20 > sma50) {
      score += 1;
      factors.push({ icon: "✨", text: "SMA20 di atas SMA50 (golden cross)", positive: true });
    } else {
      score -= 1;
      factors.push({ icon: "💀", text: "SMA20 di bawah SMA50 (death cross)", positive: false });
    }
  } else {
    factors.push({ icon: "➖", text: "Cross SMA belum tersedia", positive: null });
  }

  // 4. RSI level (+3 / +1 / 0 / -3)
  if (rsi !== null) {
    if (rsi < 30) {
      score += 3;
      factors.push({ icon: "🟢", text: `RSI oversold (${rsi.toFixed(0)})`, positive: true });
    } else if (rsi <= 45) {
      score += 1;
      factors.push({ icon: "↗️", text: `RSI pemulihan (${rsi.toFixed(0)})`, positive: true });
    } else if (rsi <= 55) {
      factors.push({ icon: "➖", text: `RSI netral (${rsi.toFixed(0)})`, positive: null });
    } else if (rsi <= 70) {
      factors.push({ icon: "➖", text: `RSI kuat (${rsi.toFixed(0)})`, positive: null });
    } else {
      score -= 3;
      factors.push({ icon: "🔴", text: `RSI overbought (${rsi.toFixed(0)})`, positive: false });
    }
  } else {
    factors.push({ icon: "➖", text: "RSI belum tersedia", positive: null });
  }

  // 5. RSI momentum over 5 days (±1)
  const rsiThen = rsiSeries.length > 5 ? rsiSeries[rsiSeries.length - 6] : null;
  if (rsi !== null && rsiThen !== null) {
    const delta = rsi - rsiThen;
    if (delta > 5) {
      score += 1;
      factors.push({ icon: "🚀", text: `Momentum RSI naik (+${delta.toFixed(0)})`, positive: true });
    } else if (delta < -5) {
      score -= 1;
      factors.push({ icon: "🪂", text: `Momentum RSI turun (${delta.toFixed(0)})`, positive: false });
    } else {
      factors.push({ icon: "➖", text: "Momentum RSI stabil", positive: null });
    }
  } else {
    factors.push({ icon: "➖", text: "Momentum RSI belum tersedia", positive: null });
  }

  // 6. Price momentum over 5 days (±1)
  const priceThen = prices.length > 5 ? prices[prices.length - 6] : null;
  if (price !== null && priceThen !== null) {
    const chg = pctChange(price, priceThen);
    if (chg > 3) {
      score += 1;
      factors.push({ icon: "📈", text: `Harga naik ${chg.toFixed(1)}% (5 hari)`, positive: true });
    } else if (chg < -3) {
      score -= 1;
      factors.push({ icon: "📉", text: `Harga turun ${chg.toFixed(1)}% (5 hari)`, positive: false });
    } else {
      factors.push({ icon: "➖", text: "Harga sideways (5 hari)", positive: null });
    }
  } else {
    factors.push({ icon: "➖", text: "Momentum harga belum tersedia", positive: null });
  }

  const signal: SignalKind = score >= 3 ? "BUY" : score <= -2 ? "SELL" : "HOLD";

  return { signal, score, maxScore: MAX_SCORE, factors, rsi, sma20, sma50 };
}
