/** @type {import('next').NextConfig} */
// Note: Next.js 14 only reads JS config (next.config.{js,mjs,cjs}); the `.ts`
// config form lands in Next 15. We keep an .mjs file so the build actually
// works on the pinned Next 14.
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // yahoo-finance2 is server-only; keep it external to the bundler.
    serverComponentsExternalPackages: ["yahoo-finance2"],
  },
};

export default nextConfig;
