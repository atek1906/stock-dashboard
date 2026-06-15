import { describe, expect, it } from "vitest";
import { cn, formatCompact, formatCurrency, formatPct } from "./utils";

describe("cn", () => {
  it("merges and dedupes tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-sm", false && "hidden", "font-bold")).toBe("text-sm font-bold");
  });
});

describe("formatCompact", () => {
  it("compacts large numbers", () => {
    expect(formatCompact(1500)).toBe("1.5K");
    expect(formatCompact(2_400_000)).toBe("2.4M");
  });
});

describe("formatCurrency", () => {
  it("formats USD with no decimals by default", () => {
    expect(formatCurrency(18500)).toBe("$18,500");
  });

  it("respects the decimals argument", () => {
    expect(formatCurrency(1234.5, 2)).toBe("$1,234.50");
  });
});

describe("formatPct", () => {
  it("formats with one decimal by default", () => {
    expect(formatPct(42.345)).toBe("42.3%");
  });

  it("respects the decimals argument", () => {
    expect(formatPct(42.34, 2)).toBe("42.34%");
  });
});
