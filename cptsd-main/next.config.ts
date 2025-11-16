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
    // Always alias shared packages to monorepo source to ensure latest exports
    const dbSourcePath = path.resolve(__dirname, '../packages/db/src');
    const petsSourcePath = path.resolve(__dirname, '../packages/pets/src');

    if (!config.resolve) {
      config.resolve = {};
    }
    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }

    config.resolve.alias['@cptsd/db'] = dbSourcePath;
    config.resolve.alias['@cptsd/db/models'] = path.resolve(dbSourcePath, 'models');
    config.resolve.alias['@cptsd/pets'] = petsSourcePath;
    config.resolve.alias['@cptsd/pets/components'] = path.resolve(petsSourcePath, 'components');
    config.resolve.alias['@cptsd/pets/lib'] = path.resolve(petsSourcePath, 'lib');
    return config;
  },
};

export default nextConfig;

