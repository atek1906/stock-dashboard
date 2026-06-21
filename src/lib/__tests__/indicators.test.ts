import { calcSMA, calcRSI, calcMACD, lastValue } from "@/lib/indicators";

describe("calcSMA", () => {
  it("returns null for the first (period-1) entries", () => {
    const sma = calcSMA([1, 2, 3, 4, 5], 3);
    expect(sma).toEqual([null, null, 2, 3, 4]);
  });

  it("computes a correct trailing average", () => {
    const sma = calcSMA([10, 20, 30, 40], 2);
    expect(sma).toEqual([null, 15, 25, 35]);
  });

  it("throws on non-positive period", () => {
    expect(() => calcSMA([1, 2], 0)).toThrow();
  });
});

describe("calcRSI", () => {
  const rising = Array.from({ length: 30 }, (_, i) => 100 + i);
  const falling = Array.from({ length: 30 }, (_, i) => 100 - i);

  it("returns null for the first `period` entries", () => {
    const rsi = calcRSI(rising, 14);
    for (let i = 0; i < 14; i++) expect(rsi[i]).toBeNull();
    expect(rsi[14]).not.toBeNull();
  });

  it("approaches 100 for a monotonic uptrend", () => {
    const rsi = calcRSI(rising, 14);
    expect(rsi[rsi.length - 1]).toBeCloseTo(100, 5);
  });

  it("approaches 0 for a monotonic downtrend", () => {
    const rsi = calcRSI(falling, 14);
    expect(rsi[rsi.length - 1]).toBeCloseTo(0, 5);
  });

  it("keeps every value within [0, 100]", () => {
    const choppy = Array.from({ length: 60 }, (_, i) => 100 + Math.sin(i / 3) * 10);
    for (const v of calcRSI(choppy, 14)) {
      if (v !== null) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(100);
      }
    }
  });

  it("returns all nulls when there are not enough points", () => {
    expect(calcRSI([1, 2, 3], 14).every((v) => v === null)).toBe(true);
  });
});

describe("calcMACD", () => {
  it("returns equal-length arrays", () => {
    const prices = Array.from({ length: 40 }, (_, i) => 100 + i);
    const { macd, signal, histogram } = calcMACD(prices);
    expect(macd).toHaveLength(40);
    expect(signal).toHaveLength(40);
    expect(histogram).toHaveLength(40);
  });

  it("is positive on a sustained uptrend (MACD above signal)", () => {
    const prices = Array.from({ length: 60 }, (_, i) => 100 + i * 2);
    const { histogram } = calcMACD(prices);
    expect(histogram[histogram.length - 1]).toBeGreaterThan(0);
  });

  it("handles an empty input", () => {
    expect(calcMACD([])).toEqual({ macd: [], signal: [], histogram: [] });
  });
});

describe("lastValue", () => {
  it("returns the last non-null entry", () => {
    expect(lastValue([1, 2, null])).toBe(2);
    expect(lastValue([null, null])).toBeNull();
  });
});
