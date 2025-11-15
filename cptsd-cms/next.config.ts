import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Enable standalone output for Docker optimization
  output: 'standalone',
  // Optimize for production
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
