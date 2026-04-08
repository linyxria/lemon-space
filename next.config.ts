import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: ['192.168.31.12'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: 'images.linyxria.tech',
      },
      {
        protocol: 'https',
        hostname: 'pub-2120d1f9926946a7ae669453e43211dc.r2.dev',
      },
    ],
  },
}

export default nextConfig
