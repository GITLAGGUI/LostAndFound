// NEXT.JS METADATA FIXES
// Fix for the themeColor metadata warnings

// 1. Create or update your app/viewport.js (or viewport.ts)
// This file should be in your app directory at the same level as layout.js

// app/viewport.js
export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' }
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover'
};

// 2. Update your layout.js metadata (remove themeColor from here)
// app/layout.js
export const metadata = {
  title: {
    template: '%s | Lost & Found',
    default: 'Lost & Found - Reunite Lost Items with Their Owners'
  },
  description: 'A modern platform to help reunite lost items with their owners using AI-powered matching.',
  keywords: ['lost', 'found', 'items', 'reunite', 'AI', 'matching'],
  authors: [{ name: 'Lost & Found Team' }],
  creator: 'Lost & Found Platform',
  publisher: 'Lost & Found',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  // Remove themeColor from here - it's now in viewport.js
};

// 3. Create or update manifest.json in your public folder
// public/manifest.json
{
  "name": "Lost & Found",
  "short_name": "Lost&Found",
  "description": "Reunite lost items with their owners",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png", 
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}

// 4. Update your next.config.js for cross-origin requests
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  images: {
    domains: [
      'your-supabase-project.supabase.co',  // Replace with your actual Supabase project URL
      'lh3.googleusercontent.com',  // For Google profile images
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**'
      }
    ]
  },
  // Add allowed dev origins for cross-origin requests
  async headers() {
    return [
      {
        source: '/_next/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          }
        ]
      }
    ];
  }
};

export default nextConfig;

// 5. Fix for individual page metadata (remove themeColor from each page)
// Example: app/dashboard/page.js
export const metadata = {
  title: 'Dashboard',
  description: 'View your lost and found items dashboard',
  // Remove themeColor from here
};

// Example: app/listings/page.js  
export const metadata = {
  title: 'All Listings',
  description: 'Browse all lost and found items',
  // Remove themeColor from here
};

// Example: app/report/page.js
export const metadata = {
  title: 'Report Item',
  description: 'Report a lost or found item',
  // Remove themeColor from here
};

// Example: app/auth/page.js
export const metadata = {
  title: 'Authentication',
  description: 'Sign in or create an account',
  // Remove themeColor from here
};

// 6. Create the missing icon files in your public folder
// You need to create these icon files:
// - public/icon-192x192.png
// - public/icon-512x512.png
// - public/favicon.ico

// 7. Optional: Create a generateMetadata function for dynamic pages
// Use this pattern for dynamic pages that need different metadata

export async function generateMetadata({ params, searchParams }) {
  // Fetch data based on params if needed
  return {
    title: `Dynamic Page Title`,
    description: `Dynamic description based on ${params.id}`,
    // Don't include themeColor here either
  };
}

// 8. Create app/apple-icon.png and app/icon.png for automatic favicon handling
// Next.js 13+ automatically handles these files if placed in the app directory:
// - app/icon.png (32x32)
// - app/apple-icon.png (180x180)
// - app/favicon.ico

// This will eliminate the need for manual favicon links in your HTML