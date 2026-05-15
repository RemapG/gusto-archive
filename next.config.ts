import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gustiarchive.s3.twcstorage.ru',
      },
    ],
  },
};

export default nextConfig;
