import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/layout/Navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Stockwise · IHSG & NASDAQ Forecaster",
  description:
    "Real-time stock screener and technical-analysis dashboard for IHSG and NASDAQ stocks.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${inter.variable} min-h-screen font-sans`}>
        <Providers>
          <Navbar />
          <main className="mx-auto max-w-[1400px] px-4 py-5">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
