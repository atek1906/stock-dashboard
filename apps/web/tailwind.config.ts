import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // Surfaces are theme-aware via CSS variables (see globals.css).
        bg: "hsl(var(--bg))",
        card: "hsl(var(--card))",
        border: "hsl(var(--border))",
        "text-primary": "hsl(var(--text-primary))",
        "text-secondary": "hsl(var(--text-secondary))",
        // Status colors are fixed across themes for consistent semantics.
        healthy: "#22c55e",
        warning: "#f59e0b",
        critical: "#ef4444",
        // Chart palette.
        chart: {
          indigo: "#6366f1",
          cyan: "#06b6d4",
          orange: "#f97316",
        },
      },
      borderRadius: {
        card: "16px",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(0.85)" },
        },
      },
      animation: {
        "pulse-dot": "pulse-dot 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
