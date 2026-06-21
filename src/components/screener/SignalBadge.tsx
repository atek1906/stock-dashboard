import type { SignalKind } from "@/types";
import { cn } from "@/lib/cn";

const STYLES: Record<SignalKind, { label: string; className: string }> = {
  BUY: { label: "BELI", className: "bg-green/15 text-green border-green/40" },
  HOLD: { label: "TAHAN", className: "bg-yellow/15 text-yellow border-yellow/40" },
  SELL: { label: "JUAL", className: "bg-red/15 text-red border-red/40" },
};

export function SignalBadge({ signal, className }: { signal: SignalKind; className?: string }) {
  const s = STYLES[signal];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold",
        s.className,
        className
      )}
    >
      {s.label}
    </span>
  );
}
