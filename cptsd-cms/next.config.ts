import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  // Enable standalone output for Docker optimization
  output: 'standalone',
  // Optimize for production
  compress: true,
  poweredByHeader: false,
  // Transpile shared packages for both Turbopack and Webpack
  transpilePackages: ['@cptsd/db'],
  // Turbopack configuration (empty allows webpack fallback)
  turbopack: {},
  // Webpack config for production builds
  webpack: (config) => {
    // Add alias for shared database package
    const dbPackagePath = path.resolve(__dirname, '../packages/db/src');
    if (!config.resolve) {
      config.resolve = {};
    }
    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }
    config.resolve.alias['@cptsd/db'] = dbPackagePath;
    config.resolve.alias['@cptsd/db/models'] = path.resolve(dbPackagePath, 'models');
    return config;
  },
};

export default nextConfig;
