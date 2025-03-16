import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  },
  // Optimize output but ensure CSS processing works
  output: 'standalone',
  // Reduce the size of the build output
  poweredByHeader: false,
  // Keep image optimization for proper rendering
  images: {
    unoptimized: false,
  },
  // Exclude large data files from the build
  webpack: (config, { isServer }) => {
    // Only include necessary data files in the build
    if (isServer) {
      // Exclude large data files from server build
      config.externals = [...config.externals, 'wordlist.tsv', 'semantle_wordlist.txt'];
    }
    
    return config;
  },
};

export default nextConfig;
