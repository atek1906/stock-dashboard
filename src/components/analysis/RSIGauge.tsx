"use client";

/**
 * Horizontal RSI gauge: a red→yellow→green→yellow→red gradient with a white
 * needle positioned at the current RSI, and 0/30/50/70/100 scale labels.
 */
export function RSIGauge({ rsi }: { rsi: number | null }) {
  const value = rsi ?? 50;
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div>
      <div className="relative h-2.5 w-full rounded-full"
        style={{
          background:
            "linear-gradient(90deg, var(--red) 0%, var(--yellow) 25%, var(--green) 50%, var(--yellow) 75%, var(--red) 100%)",
        }}
      >
        {rsi !== null && (
          <div
            className="absolute top-1/2 h-4 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow"
            style={{ left: `${clamped}%` }}
            aria-hidden
          />
        )}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted">
        <span>0</span>
        <span>30</span>
        <span>50</span>
        <span>70</span>
        <span>100</span>
      </div>
    </div>
  );
}
