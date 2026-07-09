import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone needs symlink privileges on Windows host; enable in Docker/Linux CI.
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,
  eslint: {
    // Advisory locally when eslint plugin graph is incomplete under pnpm 11
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [],
    unoptimized: false,
  },
};

export default nextConfig;
