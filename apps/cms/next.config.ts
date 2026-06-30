import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Enable standalone output for Docker optimization
  output: 'standalone',
  // Optimize for production
  compress: true,
  poweredByHeader: false,
  // Increase Server Actions body size limit to support larger multipart form submissions
  experimental: {
    // Accept larger multipart bodies through proxy/edge runtime (prevents truncated forms)
    proxyClientMaxBodySize: '30mb',
    serverActions: {
      bodySizeLimit: '30mb',
    },
  },
  // Transpile shared packages for both Turbopack and Webpack
  transpilePackages: ['@cptsd/db'],
  // Turbopack configuration (empty allows webpack fallback)
  turbopack: {},
};

export default nextConfig;
