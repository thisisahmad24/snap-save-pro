import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: 'https://snap-save-pro.onrender.com/api/:path*',
      },
    ]
  },
};

export default nextConfig;
