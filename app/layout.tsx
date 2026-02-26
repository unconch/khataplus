import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/components/auth-provider"
import { Suspense } from "react"
import { ReferralTracker } from "@/components/referral-tracker"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "KhataPlus Business - Smart Billing & Inventory",
    template: "%s | KhataPlus"
  },
  description: "The simplest billing, inventory, and khata management app designed effectively for Indian shopkeepers. GST-ready, offline-capable, and secure.",
  manifest: "/manifest.json",
  generator: "v0.app",
  metadataBase: new URL("https://khataplus.com"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://khataplus.com",
    title: "KhataPlus - Smart Billing for NorthEast India",
    description: "Manage your shop like a pro. Billing, Inventory, and Khata in one app.",
    siteName: "KhataPlus",
    images: [
      {
        url: "/og-image.png", // Need to ensure this exists or use a generator
        width: 1200,
        height: 630,
        alt: "KhataPlus Dashboard Preview",
      },
    ],
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "KhataPlus Business",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#10b981" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
}

import { OfflineBanner } from "@/components/offline-banner"
import { SyncProvider } from "@/components/sync-provider"
import { SystemAnnouncement } from "@/components/system-announcement"
import { MotionProvider } from "@/components/motion-provider"
import { ThemeProvider } from "@/components/theme-provider"

import { SpeedInsights } from "@vercel/speed-insights/next"
import { PwaInstallPrompt } from "@/components/pwa-install-prompt"
import { PWAProvider } from "@/components/pwa-provider"
import { ScrollToTop } from "@/components/scroll-to-top"
import { Toaster } from "sonner"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased relative overflow-x-hidden min-h-screen" suppressHydrationWarning>
        <div className="orbital-glow">
          <div className="orbital-blob orbital-blob-1" />
          <div className="orbital-blob orbital-blob-2" />
        </div>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <MotionProvider>
            <PWAProvider>
              <AuthProvider>
                <SyncProvider>
                  <Suspense fallback={null}>
                    <ReferralTracker />
                  </Suspense>
                  <ScrollToTop />
                  <SystemAnnouncement />
                  <OfflineBanner />
                  {children}
                </SyncProvider>
              </AuthProvider>
            </PWAProvider>
          </MotionProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
        <PwaInstallPrompt />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
