/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizePackageImports: ['react-icons'],
  },
  poweredByHeader: false,
  // Reduce logging in development
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  // Suppress route logs
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
}

module.exports = nextConfig
