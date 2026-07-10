import type { NextConfig } from "next";

function connectSrcDirective(): string {
  const extra = (process.env.NEXT_PUBLIC_CSP_CONNECT_SRC ?? "")
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const defaults = ["'self'", "http://127.0.0.1:*", "http://localhost:*"];
  return ["connect-src", ...defaults, ...extra].join(" ");
}

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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              connectSrcDirective(),
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
