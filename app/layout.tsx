import "./globals.css"
import type React from "react"
import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import { ClientProviders } from "@/components/client-providers"
import { Suspense } from "react"
import { SystemAnnouncement } from "@/components/system-announcement"

export const metadata: Metadata = {
  title: "KhataPlus - Smart Billing & Inventory for India",
  description: "GST billing, inventory management, and khata tracking built for small businesses in India. Free to try.",
  keywords: ["billing app india", "GST invoice app", "khata app", "inventory management"],
  metadataBase: new URL("https://khataplus.online"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "KhataPlus - Smart Billing for India",
    description: "GST billing, inventory & khata tracking for Indian small businesses.",
    url: "https://khataplus.online",
    siteName: "KhataPlus",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://khataplus.online/og-image.png",
        width: 1200,
        height: 630,
        alt: "KhataPlus - Smart Billing for India",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KhataPlus - Smart Billing for India",
    description: "GST billing, inventory & khata tracking for Indian small businesses.",
    images: ["https://khataplus.online/og-image.png"],
  },
  manifest: "/manifest.json",
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



import { ThemeProvider } from "@/components/theme-provider"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Toaster } from "sonner"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "KhataPlus",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, Android, iOS",
    description: "GST billing, inventory management and khata tracking for small businesses in India",
    url: "https://khataplus.online",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
    downloadUrl: "https://play.google.com/store/apps/details?id=YOUR_APP_ID",
    screenshot: "https://khataplus.online/og-image.png",
  }

  return (
    <html
      lang="en"
      suppressHydrationWarning
      style={
        {
          "--font-geist-sans": "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          "--font-geist-mono": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace",
        } as React.CSSProperties
      }
    >
      <head>
        {/* Preload Google Fonts to improve CLS and TTFB */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased relative overflow-x-hidden min-h-screen" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(softwareApplicationSchema),
          }}
        />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <Suspense fallback={null}>
            <SystemAnnouncement />
          </Suspense>
          <ClientProviders>
            {children}
          </ClientProviders>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
