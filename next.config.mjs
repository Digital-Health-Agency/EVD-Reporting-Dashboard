import { resolveApiProxyUrl } from "./lib/api-proxy-config.js";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  async rewrites() {
    const serverUrl = resolveApiProxyUrl();
    return {
      fallback: [
        {
          source: "/api/auth/:path*",
          destination: `${serverUrl}/api/auth/:path*`,
        },
        {
          source: "/api/:path*",
          destination: `${serverUrl}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
