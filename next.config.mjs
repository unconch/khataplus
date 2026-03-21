import withPWAInit from "@ducanh2912/next-pwa";
import withBundleAnalyzer from "@next/bundle-analyzer";

const enablePwa = process.env.NEXT_ENABLE_PWA === "true";

const withPWA = withPWAInit({
  dest: "public",
  disable: !enablePwa, // enable in CI/Vercel or when explicitly set
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: false, // prevent jarring reload when coming back online
  workboxOptions: {
    navigateFallbackDenylist: [/^\/api\//],
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

const isCiBuild = process.env.CI === "true" || process.env.VERCEL === "1";
const enableTypecheck = process.env.NEXT_ENABLE_TYPECHECK === "true";
const disableTypecheck = process.env.NEXT_DISABLE_TYPECHECK === "true";
const ignoreBuildErrors = disableTypecheck || (!isCiBuild && !enableTypecheck);


/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  turbopack: {},
  cacheComponents: false,
  typescript: {
    // Enable typecheck in CI by default; allow local opt-in or explicit disable.
    ignoreBuildErrors,
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
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://accounts.google.com/gsi/client https://*.vercel-scripts.com https://checkout.razorpay.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "connect-src 'self' https://*.supabase.co https://sweet-feather-8f6f.khataplus.workers.dev https://api.razorpay.com https://*.vercel-insights.com https://*.vercel-analytics.com",
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

const baseConfig = withAnalyzer(withPWA(nextConfig));

export default baseConfig;
