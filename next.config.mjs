/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  async rewrites() {
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";
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
