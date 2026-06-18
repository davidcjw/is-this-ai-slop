import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Don't advertise the framework in response headers.
  poweredByHeader: false,
  // Pin the workspace root so Next doesn't pick up a stray parent lockfile.
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Baseline security headers. (An enforcing CSP is intentionally omitted —
  // Next's hydration scripts would need a nonce; revisit with Report-Only.)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
