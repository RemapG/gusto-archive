import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/supabase-api/:path*',
        destination: 'https://xnkmfsxfuuggmmgughyz.supabase.co/:path*', // Proxy to Supabase
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'xnkmfsxfuuggmmgughyz.supabase.co',
      },
    ],
  },
};

export default nextConfig;
