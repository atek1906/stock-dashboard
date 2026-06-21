// Pure technical-indicator math. No I/O — fully unit-tested.

/**
 * Simple Moving Average. Returns an array the same length as `prices`, with
 * `null` for the first (period - 1) entries where a full window isn't available.
 */
export function calcSMA(prices: number[], period: number): (number | null)[] {
  if (period <= 0) throw new Error("SMA period must be positive");
  const out: (number | null)[] = new Array(prices.length).fill(null);
  let windowSum = 0;
  for (let i = 0; i < prices.length; i++) {
    windowSum += prices[i];
    if (i >= period) windowSum -= prices[i - period];
    if (i >= period - 1) out[i] = windowSum / period;
  }
  return out;
}

/**
 * Relative Strength Index using Wilder's smoothing (the standard RSI, not a
 * simple moving average of gains/losses). Returns an array the same length as
 * `prices`, with `null` for the first `period` entries.
 */
export function calcRSI(prices: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = new Array(prices.length).fill(null);
  if (prices.length <= period) return out;

  // Seed: simple average of the first `period` gains and losses.
  let gainSum = 0;
  let lossSum = 0;
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change >= 0) gainSum += change;
    else lossSum -= change;
  }
  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;
  out[period] = rsiFrom(avgGain, avgLoss);

  // Wilder smoothing for the remainder.
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out[i] = rsiFrom(avgGain, avgLoss);
  }
  return out;
}

function rsiFrom(avgGain: number, avgLoss: number): number {
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/** Exponential Moving Average, seeded with the first price. */
function ema(prices: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = new Array(prices.length);
  out[0] = prices[0] ?? 0;
  for (let i = 1; i < prices.length; i++) {
    out[i] = prices[i] * k + out[i - 1] * (1 - k);
  }
  return out;
}

/**
 * MACD with the standard 12/26/9 parameters. Returns full-length arrays
 * (implemented now for future use; not yet surfaced in the signal engine).
 */
export function calcMACD(prices: number[]): {
  macd: number[];
  signal: number[];
  histogram: number[];
} {
  if (prices.length === 0) return { macd: [], signal: [], histogram: [] };
  const ema12 = ema(prices, 12);
  const ema26 = ema(prices, 26);
  const macd = prices.map((_, i) => ema12[i] - ema26[i]);
  const signal = ema(macd, 9);
  const histogram = macd.map((v, i) => v - signal[i]);
  return { macd, signal, histogram };
}

/** Last non-null value of an indicator series, or null if none. */
export function lastValue(series: (number | null)[]): number | null {
  for (let i = series.length - 1; i >= 0; i--) {
    if (series[i] !== null) return series[i];
  }
  return null;
}
