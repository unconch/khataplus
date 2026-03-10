import { withSentryConfig } from "@sentry/nextjs";
import withPWAInit from "@ducanh2912/next-pwa";
import withBundleAnalyzer from "@next/bundle-analyzer";

const withPWA = withPWAInit({
  dest: "public",
  disable: false, // enable it
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: false, // prevent jarring reload when coming back online
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        // Cache API routes for dashboard data
        urlPattern: /^https:\/\/khataplus\.online\/api\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "api-cache",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 5, // 5 minutes
          },
        },
      },
      {
        // Cache fonts
        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "font-cache",
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          },
        },
      },
      {
        // Cache images
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "image-cache",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
        },
      },
    ],
  },
});

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const isNonEmptyString = (value) =>
  typeof value === "string" &&
  value.trim() !== "" &&
  value.trim().toLowerCase() !== "undefined" &&
  value.trim().toLowerCase() !== "null";

const sentryOrg = isNonEmptyString(process.env.SENTRY_ORG)
  ? process.env.SENTRY_ORG.trim()
  : undefined;
const sentryProject = isNonEmptyString(process.env.SENTRY_PROJECT)
  ? process.env.SENTRY_PROJECT.trim()
  : undefined;
const sentryAuthToken = isNonEmptyString(process.env.SENTRY_AUTH_TOKEN)
  ? process.env.SENTRY_AUTH_TOKEN.trim()
  : undefined;
const vercelOrgId = isNonEmptyString(process.env.VERCEL_ORG_ID)
  ? process.env.VERCEL_ORG_ID.trim()
  : undefined;
const vercelProjectId = isNonEmptyString(process.env.VERCEL_PROJECT_ID)
  ? process.env.VERCEL_PROJECT_ID.trim()
  : undefined;
const enableAutomaticVercelMonitors = Boolean(
  process.env.SENTRY_ENABLE_VERCEL_MONITORS === "true" &&
  process.env.VERCEL === "1" &&
  sentryOrg &&
  sentryProject &&
  sentryAuthToken &&
  vercelOrgId &&
  vercelProjectId,
);


/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  turbopack: {},
  cacheComponents: false,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://accounts.google.com/gsi/client https://*.vercel-scripts.com https://checkout.razorpay.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "connect-src 'self' https://*.supabase.co https://sweet-feather-8f6f.khataplus.workers.dev https://api.razorpay.com https://o*.ingest.sentry.io https://*.vercel-insights.com https://*.vercel-analytics.com",
              "img-src 'self' data: https://*.supabase.co https://*.googleusercontent.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "frame-src https://checkout.razorpay.com https://accounts.google.com",
            ].join("; "),
          },
        ],
      },
    ]
  },
};

const sentryWrappedConfig = withSentryConfig(withPWA(nextConfig), {
  ...(sentryOrg ? { org: sentryOrg } : {}),
  ...(sentryProject ? { project: sentryProject } : {}),
  ...(sentryAuthToken ? { authToken: sentryAuthToken } : {}),
  silent: !process.env.CI,
  tunnelRoute: "/monitoring",
  ...(sentryAuthToken ? { widenClientFileUpload: true } : {}),
  webpack: {
    ...(enableAutomaticVercelMonitors ? { automaticVercelMonitors: true } : {}),
    treeshake: {
      removeDebugLogging: true,
    },
  },
});

export default withAnalyzer(sentryWrappedConfig);
