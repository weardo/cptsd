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
    // Add alias for shared packages - try node_modules first, then source
    const dbPackagePath = path.resolve(__dirname, 'node_modules/@cptsd/db/src');
    const petsPackagePath = path.resolve(__dirname, 'node_modules/@cptsd/pets/src');
    const dbSourcePath = path.resolve(__dirname, '../packages/db/src');
    const petsSourcePath = path.resolve(__dirname, '../packages/pets/src');
    
    if (!config.resolve) {
      config.resolve = {};
    }
    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }
    
    // Use node_modules path if it exists, otherwise fall back to source
    const fs = require('fs');
    const finalDbPath = fs.existsSync(dbPackagePath) ? dbPackagePath : dbSourcePath;
    const finalPetsPath = fs.existsSync(petsPackagePath) ? petsPackagePath : petsSourcePath;
    
    config.resolve.alias['@cptsd/db'] = finalDbPath;
    config.resolve.alias['@cptsd/db/models'] = path.resolve(finalDbPath, 'models');
    config.resolve.alias['@cptsd/pets'] = finalPetsPath;
    config.resolve.alias['@cptsd/pets/components'] = path.resolve(finalPetsPath, 'components');
    config.resolve.alias['@cptsd/pets/lib'] = path.resolve(finalPetsPath, 'lib');
    return config;
  },
};

export default nextConfig;

