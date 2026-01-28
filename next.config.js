/** @type {import('next').NextConfig} */
const nextConfig = {
  assetPrefix: process.env.NEXT_PUBLIC_SUB_URL
    ? process.env.NEXT_PUBLIC_SUB_URL + '/'
    : '',
  trailingSlash: true,
  images: {
    // Use remotePatterns instead of deprecated `domains` configuration.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'profile.line-scdn.net',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Turbopack config (empty to silence webpack migration warning)
  turbopack: {},
  // Workaround: avoid filesystem cache serialization of webpack Warning objects
  // by using an in-memory cache during development. This prevents warnings like:
  // "No serializer registered for Warning" coming from PackFileCacheStrategy.
  webpack(config, { dev }) {
    if (dev) {
      // Use memory cache in dev to avoid serializing non-serializable warnings to disk
      config.cache = { type: 'memory' };
    }
    return config;
  },
};

module.exports = nextConfig;
