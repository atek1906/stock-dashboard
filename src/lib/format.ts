/** Formatting helpers shared across the UI. All tolerate null → "--". */

const DASH = "--";

/** Format a price with its currency (IDR has no decimals, USD has two). */
export function formatPrice(value: number | null | undefined, currency = "USD"): string {
  if (value === null || value === undefined || Number.isNaN(value)) return DASH;
  const isIDR = currency === "IDR";
  return new Intl.NumberFormat(isIDR ? "id-ID" : "en-US", {
    style: "currency",
    currency: isIDR ? "IDR" : currency,
    maximumFractionDigits: isIDR ? 0 : 2,
    minimumFractionDigits: isIDR ? 0 : 2,
  }).format(value);
}

/** Plain localized number (no currency symbol). */
export function formatNumber(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return DASH;
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value);
}

/** Signed percentage, e.g. "+1.2%" / "-0.8%". */
export function formatPct(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return DASH;
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

/** Compact volume / market cap, e.g. "1.2M", "3.4B". */
export function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return DASH;
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}
