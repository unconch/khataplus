import { withSentryConfig } from "@sentry/nextjs";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  swcMinify: true,
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: ({ request }) => request.method === 'POST',
        handler: 'NetworkOnly',
        options: {
          backgroundSync: {
            name: 'cooperative-sync-queue',
            options: {
              maxRetentionTime: 24 * 60 // 24 hours
            }
          }
        }
      }
    ]
  },
  fallbacks: {
    document: "/offline"
  }
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {},
  cacheComponents: false,
  experimental: {
    viewTransition: true,
  },
  async rewrites() {
    return [
      // Proxy Descope CDN scripts through your domain
      {
        source: "/descope-cdn/:path*",
        destination: "https://static.descope.com/:path*",
      },
    ]
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.descope.com https://descopecdn.com https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://static.descope.com https://descopecdn.com",
              "connect-src 'self' https://api.descope.com https://static.descope.com https://descopecdn.com",
              "frame-src 'self' https://static.descope.com https://descopecdn.com",
              "img-src 'self' data: https://static.descope.com https://descopecdn.com",
              "font-src 'self' data: https://static.descope.com https://descopecdn.com",
            ].join("; "),
          },
        ],
      },
    ]
  },
}

export default withSentryConfig(withPWA(nextConfig), {
  org: "chiga",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  // Disable automatic wrapping of App Router server components.
  // The sentry-wrapper-module interferes with dynamic imports 
  // (e.g. @descope/react-sdk), causing TypeError in some browsers.
  autoInstrumentAppRouter: false,
  autoInstrumentServerFunctions: false,
  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  }
});
