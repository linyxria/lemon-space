import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: ['192.168.31.12'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.linyxria.tech',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '9000',
        pathname: '/lemon-gallery/**',
      },
    ],
    dangerouslyAllowLocalIP: true,
  },
}

export default withNextIntl(nextConfig)
