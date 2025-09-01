/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Allow external images from Google Cloud Storage (your Firebase bucket)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/**', // allow all paths (like /your-bucket-name/...)
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/v0/b/**', // Firebase Storage specific path
      },
    ],
  },
  
  // ✅ Firebase Admin configuration to prevent build errors
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin'],
  },
  
  // ✅ Webpack configuration for Firebase Admin
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize firebase-admin to prevent bundling issues
      config.externals.push('firebase-admin');
    }
    return config;
  },
  
  // ✅ Keep your rewrites for subdomains
  async rewrites() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: ':subdomain.afrihr.com'
          }
        ],
        destination: '/:path*',
      },
      // Add localhost support for development
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