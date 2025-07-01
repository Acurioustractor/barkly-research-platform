import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  eslint: {
    // Temporarily allow production builds with ESLint errors
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
