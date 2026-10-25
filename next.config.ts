import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: path.resolve(__dirname),
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'huggingface.co' },
      { protocol: 'https', hostname: 'cdn-avatars.huggingface.co' },
      { protocol: 'https', hostname: 'cdn-uploads.huggingface.co' },
    ],
  },
};

export default nextConfig;
