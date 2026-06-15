"use client";

import { ThemeProvider } from "next-themes";
import { useMetricsStream } from "@/lib/sse";

/** Mounts the SSE subscription exactly once for the whole app. */
function StreamProvider({ children }: { children: React.ReactNode }) {
  useMetricsStream();
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <StreamProvider>{children}</StreamProvider>
    </ThemeProvider>
  );
}
