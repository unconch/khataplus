"use client"

import dynamic from "next/dynamic"

// Features Section loads immediately with loading fallback
const FeaturesSection = dynamic(
  () => import("@/components/landing-page/FeaturesSection").then(m => m.FeaturesSection),
  {
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    ),
    ssr: true
  }
)

// Lazy load secondary sections without SSR
const SolutionsSection = dynamic(
  () => import("@/components/landing-page/SolutionsSection").then(m => m.SolutionsSection),
  { ssr: false }
)

const PlatformSection = dynamic(
  () => import("@/components/landing-page/PlatformSection").then(m => m.PlatformSection),
  { ssr: false }
)

const HowItWorksSection = dynamic(
  () => import("@/components/landing-page/HowItWorksSection").then(m => m.HowItWorksSection),
  { ssr: false }
)

const FreeToolsSection = dynamic(
  () => import("@/components/landing-page/FreeToolsSection").then(m => m.FreeToolsSection),
  { ssr: false }
)

const SiteFooter = dynamic(
  () => import("@/components/landing-page/SiteFooter").then(m => m.SiteFooter),
  { ssr: false }
)

export function LandingPageClient() {
  return (
    <>
      {/* Evidence: Core Features â€” load first with visible loading state */}
      <FeaturesSection />

      {/* Target: Industry Specifics */}
      <SolutionsSection />

      {/* Power: Unified Platform Deep-dive */}
      <PlatformSection />

      {/* Ease: Step-by-step Onboarding */}
      <HowItWorksSection />

      {/* Hook: Free Growth Tools */}
      <FreeToolsSection />

      <SiteFooter />
    </>
  )
}

