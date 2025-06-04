import path from 'path'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable Turbopack for faster builds and better performance
  experimental: {
    turbo: {
      // Enable turbo for both dev and build
      useSwcCss: true,
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
    // Optimize package imports for faster loading
    optimizePackageImports: [
      'lucide-react', 
      '@radix-ui/react-icons', 
      'recharts',
      '@radix-ui/react-avatar',
      '@radix-ui/react-button',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      'framer-motion',
      'date-fns'
    ],
    // Better CSS handling (disabled to avoid critters dependency issues)
    optimizeCss: false,
    // Enable PPR for faster page loads
    ppr: false, // Set to true when stable
  },

  // Move server external packages to the correct location
  serverExternalPackages: ['sharp'],

  // Enable compression for better performance
  compress: true,
  
  // Optimize images for faster loading
  images: {
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    minimumCacheTTL: 31536000, // 1 year cache
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Power performance optimizations
  poweredByHeader: false,
  
  // Better webpack optimization
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
          },
          common: {
            name: 'common',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
          default: {
            minChunks: 2,
            priority: -10,
            reuseExistingChunk: true,
          },
        },
      }
    }

    // Optimize modules resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(process.cwd(), '.'),
    }

    return config
  },

  // Faster builds in development  
  reactStrictMode: true,

  // Only ignore linting in development for faster builds
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV !== 'production',
  },
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV !== 'production',
  },

  // Headers for better caching
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

export default nextConfig
