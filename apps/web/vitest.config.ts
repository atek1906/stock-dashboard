import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      // Pure, deterministic modules. The SSE client hook (lib/sse.ts) depends
      // on browser EventSource and is covered by the Playwright E2E instead.
      include: ["lib/metrics.ts", "lib/utils.ts", "lib/store.ts"],
      exclude: ["lib/**/*.test.ts", "**/*.d.ts"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
      "@monitoring/types": resolve(__dirname, "../../packages/types/src/index.ts"),
    },
  },
});
