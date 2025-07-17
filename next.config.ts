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
  experimental: {
    // Other experimental features can be added here
    serverComponentsExternalPackages: ['pdf-parse'],
  },
  // Allow larger file uploads
  serverRuntimeConfig: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },
  webpack: (config, { isServer }) => {
    // Fix for module resolution issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        async_hooks: false,
        worker_threads: false,
        child_process: false,
        diagnostics_channel: false,
        module: false,
      };
    }
    return config;
  },
};

export default nextConfig;