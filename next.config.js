/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.google.com',
        pathname: '/s2/favicons/**',
      },
    ],
  },
  // Tối ưu production build
  compress: true,
  poweredByHeader: false,
}

module.exports = nextConfig

