import type { NextConfig } from "next";

const backendApiUrl = (
  process.env.ICEBOT_BACKEND_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${backendApiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
