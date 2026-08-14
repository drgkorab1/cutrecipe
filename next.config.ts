import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // cheerio uses Node.js internals — keep it server-side only
  serverExternalPackages: ['cheerio'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
}

export default nextConfig
