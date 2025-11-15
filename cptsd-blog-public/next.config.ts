import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  // Transpile shared packages for both Turbopack and Webpack
  transpilePackages: ['@cptsd/db', '@cptsd/pets'],
  // Turbopack configuration (empty allows webpack fallback)
  turbopack: {},
  // Webpack config for production builds
  webpack: (config) => {
    // Add alias for shared packages
    const dbPackagePath = path.resolve(__dirname, '../packages/db/src');
    const petsPackagePath = path.resolve(__dirname, '../packages/pets/src');
    if (!config.resolve) {
      config.resolve = {};
    }
    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }
    config.resolve.alias['@cptsd/db'] = dbPackagePath;
    config.resolve.alias['@cptsd/db/models'] = path.resolve(dbPackagePath, 'models');
    config.resolve.alias['@cptsd/pets'] = petsPackagePath;
    config.resolve.alias['@cptsd/pets/components'] = path.resolve(petsPackagePath, 'components');
    config.resolve.alias['@cptsd/pets/lib'] = path.resolve(petsPackagePath, 'lib');
    return config;
  },
};

export default nextConfig;

