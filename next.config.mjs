/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Allow production builds to complete even if there are type errors
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignore ESLint errors during builds (Vercel)
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;



