import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  // Transpile shared packages for both Turbopack and Webpack
  transpilePackages: ['@cptsd/db', '@cptsd/pets'],
  // Turbopack configuration (empty allows webpack fallback)
  turbopack: {},
};

export default nextConfig;

