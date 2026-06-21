"use client";

import type { SignalKind, StockData } from "@/types";
import { RSIGauge } from "./RSIGauge";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";

const META: Record<
  SignalKind,
  { icon: string; label: string; color: string; border: string; bg: string; desc: string; tip: string }
> = {
  BUY: {
    icon: "🚀",
    label: "SINYAL: BELI",
    color: "text-green",
    border: "border-green/50",
    bg: "bg-green/10",
    desc: "Indikator teknikal condong bullish. Tren dan momentum mendukung potensi kenaikan.",
    tip: "Pertimbangkan entry bertahap (DCA) dan tetapkan stop-loss di bawah SMA50 untuk membatasi risiko.",
  },
  HOLD: {
    icon: "⏸️",
    label: "SINYAL: TAHAN",
    color: "text-yellow",
    border: "border-yellow/50",
    bg: "bg-yellow/10",
    desc: "Sinyal campuran. Tren belum cukup kuat ke salah satu arah — tunggu konfirmasi.",
    tip: "Pantau breakout dari level SMA20/SMA50 sebelum menambah atau mengurangi posisi.",
  },
  SELL: {
    icon: "🔴",
    label: "SINYAL: JUAL",
    color: "text-red",
    border: "border-red/50",
    bg: "bg-red/10",
    desc: "Indikator teknikal condong bearish. Tekanan jual dan momentum negatif mendominasi.",
    tip: "Pertimbangkan kurangi eksposur atau tunggu RSI kembali ke zona oversold untuk re-entry.",
  },
};

function rsiColor(rsi: number | null): string {
  if (rsi === null) return "text-muted";
  if (rsi < 30) return "text-green";
  if (rsi > 70) return "text-red";
  if (rsi > 55) return "text-yellow";
  return "text-text";
}

export function ForecastPanel({ stock }: { stock: StockData }) {
  const { signal, score, maxScore, factors, rsi, sma50 } = stock.signalDetail;
  const meta = META[signal];
  const aboveSma50 = stock.currentPrice !== null && sma50 !== null && stock.currentPrice > sma50;
  const strengthPct = Math.min(100, (Math.abs(score) / maxScore) * 100);

  return (
    <div className="space-y-4">
      {/* 1. Signal box */}
      <div className={cn("rounded-xl border p-4", meta.border, meta.bg)}>
        <div className="flex items-center gap-3">
          <span className="text-3xl leading-none">{meta.icon}</span>
          <div className="flex-1">
            <p className={cn("text-base font-bold", meta.color)}>{meta.label}</p>
            <p className="text-xs text-muted">
              Skor teknikal: {score > 0 ? "+" : ""}
              {score} / {maxScore}
            </p>
          </div>
        </div>
        <div className="mt-3 h-1.5 w-[80px] overflow-hidden rounded-full bg-surface-2">
          <div
            className={cn(
              "h-full rounded-full",
              signal === "BUY" ? "bg-green" : signal === "SELL" ? "bg-red" : "bg-yellow"
            )}
            style={{ width: `${strengthPct}%` }}
          />
        </div>
      </div>

      {/* 2. Description */}
      <p className="text-sm text-muted">{meta.desc}</p>

      {/* 3. Indicator grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-border bg-surface-2 p-2.5">
          <p className="text-[10px] uppercase tracking-wide text-muted">Harga</p>
          <p className="mt-0.5 text-sm font-semibold text-text">
            {formatPrice(stock.currentPrice, stock.currency)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface-2 p-2.5">
          <p className="text-[10px] uppercase tracking-wide text-muted">RSI (14)</p>
          <p className={cn("mt-0.5 text-sm font-semibold", rsiColor(rsi))}>
            {rsi !== null ? rsi.toFixed(1) : "--"}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface-2 p-2.5">
          <p className="text-[10px] uppercase tracking-wide text-muted">vs SMA50</p>
          <p className={cn("mt-0.5 text-sm font-semibold", aboveSma50 ? "text-green" : "text-red")}>
            {sma50 === null ? "--" : aboveSma50 ? "▲ Di atas" : "▼ Di bawah"}
          </p>
        </div>
      </div>

      {/* 4. RSI gauge */}
      <div>
        <p className="mb-1.5 text-[10px] uppercase tracking-wide text-muted">RSI Gauge</p>
        <RSIGauge rsi={rsi} />
      </div>

      {/* 5. Factor analysis */}
      <div>
        <p className="mb-2 text-xs font-semibold text-text">Faktor Analisis</p>
        <ul className="space-y-1.5">
          {factors.map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-xs">
              <span>{f.icon}</span>
              <span
                className={cn(
                  f.positive === true
                    ? "text-green"
                    : f.positive === false
                      ? "text-red"
                      : "text-muted"
                )}
              >
                {f.text}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* 6. Investment tip */}
      <div className="rounded-lg border border-blue/30 bg-blue/10 p-3">
        <p className="text-xs font-semibold text-blue">💡 Tips Investasi</p>
        <p className="mt-1 text-xs text-muted">{meta.tip}</p>
      </div>
    </div>
  );
}
