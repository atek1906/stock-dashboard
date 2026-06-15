/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emit a self-contained server bundle for the Docker runner stage. This is
  // opt-in (NEXT_OUTPUT=standalone) because the standalone copy step relies on
  // symlinks, which Windows blocks without elevated privileges. The Dockerfile
  // sets it; a plain local `pnpm build` skips it and works on any OS.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  // The shared types package is consumed as raw TypeScript source.
  transpilePackages: ["@monitoring/types"],
  experimental: {
    // Trace files from the monorepo root so standalone output is complete.
    outputFileTracingRoot: process.cwd() + "/../../",
  },
};

export default nextConfig;
