import { generateSignal } from "@/lib/signals";

// Helper to build a constant series of a given length.
const fill = (len: number, v: number): number[] => new Array(len).fill(v);

describe("generateSignal", () => {
  it("always returns six factors and a maxScore of 8", () => {
    const res = generateSignal(fill(10, 100), fill(10, 100), fill(10, 100), fill(10, 50));
    expect(res.factors).toHaveLength(6);
    expect(res.maxScore).toBe(8);
  });

  it("flags BUY on a bullish setup", () => {
    const prices = [95, 96, 97, 98, 100, 103, 105, 107, 109, 110];
    const sma20 = fill(10, 105);
    const sma50 = fill(10, 100);
    const rsi = [35, 35, 35, 35, 30, 36, 37, 38, 39, 40];
    const res = generateSignal(prices, sma20, sma50, rsi);
    expect(res.signal).toBe("BUY");
    expect(res.score).toBeGreaterThanOrEqual(3);
  });

  it("flags SELL on a bearish setup", () => {
    const prices = [110, 108, 106, 104, 100, 98, 95, 93, 91, 90];
    const sma20 = fill(10, 95);
    const sma50 = fill(10, 100);
    const rsi = [82, 82, 82, 82, 82, 80, 79, 78, 76, 75];
    const res = generateSignal(prices, sma20, sma50, rsi);
    expect(res.signal).toBe("SELL");
    expect(res.score).toBeLessThanOrEqual(-2);
  });

  it("flags HOLD on a mixed setup", () => {
    const prices = [100, 100, 100, 100, 100.5, 100.6, 100.7, 100.8, 100.9, 101];
    const sma20 = fill(10, 100);
    const sma50 = fill(10, 100.5);
    const rsi = fill(10, 50);
    const res = generateSignal(prices, sma20, sma50, rsi);
    expect(res.signal).toBe("HOLD");
    expect(res.score).toBeGreaterThan(-2);
    expect(res.score).toBeLessThan(3);
  });

  it("degrades gracefully when indicators are unavailable", () => {
    const res = generateSignal([100], [null], [null], [null]);
    expect(res.factors).toHaveLength(6);
    expect(res.signal).toBe("HOLD");
    // Neutral factors carry a null `positive` flag.
    expect(res.factors.some((f) => f.positive === null)).toBe(true);
  });

  it("rewards positive RSI and price momentum over 5 days", () => {
    const prices = [100, 100, 100, 100, 100, 101, 102, 103, 104, 110];
    const rsi = [40, 40, 40, 40, 40, 42, 44, 46, 48, 50];
    const res = generateSignal(prices, fill(10, 99), fill(10, 98), rsi);
    const texts = res.factors.map((f) => f.text).join(" ");
    expect(texts).toContain("Harga naik");
  });
});
