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

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@react-pdf/renderer');
    }

    config.resolve.alias = {
      ...config.resolve.alias,
      'bidi-js': require.resolve('bidi-js/dist/bidi.js'),
    };

    return config;
  },

  async rewrites() {
    return [
      {
        source: '/:path*',
        has: [
          { type: 'host', value: ':subdomain.afrihrm.com' },
        ],
        destination: '/:path*',
      },
      {
        source: '/:path*',
        has: [
          { type: 'host', value: ':subdomain.localhost' },
        ],
        destination: '/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
