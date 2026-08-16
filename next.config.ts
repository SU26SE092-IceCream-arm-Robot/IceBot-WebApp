import path from "node:path";
import type { NextConfig } from "next";

const backendApiUrl = (
  process.env.ICEBOT_BACKEND_URL || "https://api.icebot.io.vn"
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    return [
      {
        source: "/api/backend/hubs/:path*",
        destination: `${backendApiUrl}/hubs/:path*`,
      },
      {
        source: "/api/backend/graphql",
        destination: `${backendApiUrl}/graphql`,
      },
      {
        source: "/api/backend/:path*",
        destination: `${backendApiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
