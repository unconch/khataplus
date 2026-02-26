import { withSentryConfig } from "@sentry/nextjs";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // Disable PWA in dev mode
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
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.descope.com https://descopecdn.com https://*.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline' https://*.descope.com https://descopecdn.com https://fonts.googleapis.com https://grainy-gradients.vercel.app",
              "connect-src 'self' https://*.descope.com https://api.descope.com https://descopecdn.com https://*.vercel-scripts.com",
              "frame-src 'self' https://*.descope.com https://descopecdn.com",
              "img-src 'self' data: https://*.descope.com https://descopecdn.com https://*.googleusercontent.com https://images.unsplash.com https://grainy-gradients.vercel.app",
              "font-src 'self' data: https://fonts.gstatic.com",
              "worker-src 'self' blob:",
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
  // The sentry-wrapper-module can interfere with dynamic imports in client auth flows.
  autoInstrumentAppRouter: false,
  autoInstrumentServerFunctions: false,
  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  }
});
