"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, Cpu, LayoutDashboard, ServerCog, X } from "lucide-react";
import { useUIStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/system", label: "System", icon: Cpu },
  { href: "/api-health", label: "API Health", icon: ServerCog },
  { href: "/business", label: "Business", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const mobileOpen = useUIStore((s) => s.mobileNavOpen);
  const closeMobileNav = useUIStore((s) => s.closeMobileNav);

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          aria-label="Close navigation"
          onClick={closeMobileNav}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-card transition-all duration-200",
          collapsed ? "md:w-16" : "md:w-60",
          "w-60",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Activity className="h-6 w-6 shrink-0 text-chart-indigo" />
          {!collapsed && (
            <span className="truncate text-sm font-semibold text-text-primary">
              {process.env.NEXT_PUBLIC_APP_NAME ?? "Monitoring"}
            </span>
          )}
          <button
            aria-label="Close navigation"
            onClick={closeMobileNav}
            className="ml-auto text-text-secondary md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-2">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={closeMobileNav}
                title={label}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-chart-indigo/15 text-chart-indigo"
                    : "text-text-secondary hover:bg-border/50 hover:text-text-primary"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
