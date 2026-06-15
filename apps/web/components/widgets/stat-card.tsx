import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  /** Percentage delta vs a baseline; positive is green unless `invertDelta`. */
  delta?: number;
  invertDelta?: boolean;
  children?: React.ReactNode; // gauge / sparkline slot
  className?: string;
}

/** Headline metric card: uppercase label, 32px bold value, optional visual. */
export function StatCard({ label, value, delta, invertDelta, children, className }: StatCardProps) {
  const good = delta === undefined ? undefined : invertDelta ? delta <= 0 : delta >= 0;

  return (
    <Card className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="label-caps">{label}</span>
          <p className="mt-1 text-[32px] font-bold leading-none text-text-primary">{value}</p>
        </div>
        {delta !== undefined && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              good ? "text-healthy" : "text-critical"
            )}
          >
            {good ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
      {children}
    </Card>
  );
}
