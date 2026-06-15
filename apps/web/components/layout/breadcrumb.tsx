"use client";

import { usePathname } from "next/navigation";

const LABELS: Record<string, string> = {
  "": "Overview",
  system: "System",
  "api-health": "API Health",
  business: "Business",
};

export function Breadcrumb() {
  const pathname = usePathname();
  const segment = pathname.split("/").filter(Boolean)[0] ?? "";
  const label = LABELS[segment] ?? "Overview";

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-text-secondary">Dashboard</span>
      <span className="text-text-secondary">/</span>
      <span className="font-medium text-text-primary">{label}</span>
    </div>
  );
}
