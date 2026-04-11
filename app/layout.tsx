import type React from "react"
import type { Metadata, Viewport } from "next"
import { Suspense } from "react"
import { cookies } from "next/headers"
import "./globals.css"
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, getDictionary, normalizeLocale } from "@/lib/i18n"
import { getFormattingLocale } from "@/lib/locale-format"

export const metadata: Metadata = {
  title: "KhataPlus - Smart Billing & Inventory for NorthEast India",
  description: "GST billing, inventory management, and khata tracking built for small businesses in Assam, Meghalaya, Manipur & NorthEast India. Free to try.",
  keywords: ["billing app northeast india", "GST invoice app Assam", "khata app", "inventory management Guwahati"],
  metadataBase: new URL("https://khataplus.online"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "KhataPlus - Smart Billing for NorthEast India",
    description: "GST billing, inventory & khata tracking for NorthEast India small businesses.",
    url: "https://khataplus.online",
    siteName: "KhataPlus",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://khataplus.online/og-image.png",
        width: 1200,
        height: 630,
        alt: "KhataPlus - Smart Billing for NorthEast India",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KhataPlus - Smart Billing for NorthEast India",
    description: "GST billing, inventory & khata tracking for NorthEast India small businesses.",
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
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#10b981" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
}

import { SystemAnnouncement } from "@/components/system-announcement"
import { ThemeProvider } from "@/components/theme-provider"
import { LocaleProvider } from "@/components/locale-provider"
import { MotionProvider } from "@/components/motion-provider"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Toaster } from "sonner"

export default async function RootLayout({
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
    description: "GST billing, inventory management and khata tracking for small businesses in NorthEast India",
    url: "https://khataplus.online",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
    downloadUrl: "https://play.google.com/store/apps/details?id=YOUR_APP_ID",
    screenshot: "https://khataplus.online/og-image.png",
  }

  const cookieStore = await cookies()
  const themeCookie = cookieStore.get("kp_theme")?.value
  const locale = normalizeLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value ?? DEFAULT_LOCALE)
  const dictionary = getDictionary(locale)
  const formattingLocale = getFormattingLocale(locale)
  const isDarkTheme = themeCookie === "dark"

  return (
    <html
      lang={dictionary.htmlLang}
      suppressHydrationWarning
      className={isDarkTheme ? "dark" : ""}
      style={
        {
          "--font-geist-sans": "\"Noto Sans Bengali\", \"Nirmala UI\", \"Hind Siliguri\", \"Mukta\", ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          "--font-geist-mono": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace",
          colorScheme: isDarkTheme ? "dark" : "light",
        } as React.CSSProperties
      }
      data-format-locale={formattingLocale}
    >
      <body className="font-sans antialiased relative overflow-x-hidden min-h-screen" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(softwareApplicationSchema),
          }}
        />
        <div className="orbital-glow">
          <div className="orbital-blob orbital-blob-1" />
          <div className="orbital-blob orbital-blob-2" />
        </div>
        <LocaleProvider initialLocale={locale}>
          <MotionProvider>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
              <Suspense fallback={null}>
                <SystemAnnouncement />
              </Suspense>
              {children}
            </ThemeProvider>
          </MotionProvider>
        </LocaleProvider>
        <Analytics />
        <SpeedInsights />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
