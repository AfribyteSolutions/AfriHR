// ===== 3. UPDATED next.config.js =====
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/v0/b/**',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('firebase-admin');
    }
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: ':subdomain.afrihrm.com' // ✅ Fixed: correct domain
          }
        ],
        destination: '/:path*',
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: ':subdomain.localhost'
          }
        ],
        destination: '/:path*',
      },
    ];
  },
};

module.exports = nextConfig;