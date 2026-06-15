"use client";

import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, BellOff } from "lucide-react";
import { useAlertStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export function AlertFeed({ className }: { className?: string }) {
  const alerts = useAlertStore((s) => s.alerts);
  const unread = useAlertStore((s) => s.unread);
  const markAllRead = useAlertStore((s) => s.markAllRead);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Alert Feed
        </CardTitle>
        {unread > 0 && (
          <button onClick={markAllRead} title="Mark all read">
            <Badge variant="critical">{unread} new</Badge>
          </button>
        )}
      </CardHeader>

      <div className="scroll-thin max-h-[420px] space-y-2 overflow-y-auto pr-1">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-text-secondary">
            <BellOff className="h-6 w-6" />
            <span className="text-sm">No threshold breaches</span>
          </div>
        ) : (
          alerts.map((a) => (
            <div
              key={a.id}
              className="flex items-start gap-3 rounded-lg border border-border/60 bg-bg/40 p-2.5"
            >
              <Badge variant={a.severity}>{a.severity}</Badge>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-primary">{a.metric}</p>
                <p className="truncate text-xs text-text-secondary">{a.message}</p>
              </div>
              <time
                className="shrink-0 text-[11px] text-text-secondary"
                dateTime={new Date(a.ts).toISOString()}
              >
                {formatDistanceToNow(a.ts, { addSuffix: true })}
              </time>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
