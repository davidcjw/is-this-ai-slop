import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Don't advertise the framework in response headers.
  poweredByHeader: false,
  // Pin the workspace root so Next doesn't pick up a stray parent lockfile.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
