import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@cptsd/db', '@cptsd/ai'],
};

export default nextConfig;
