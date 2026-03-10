"use client"

import dynamic from "next/dynamic"
import { LazySection } from "@/components/lazy-section"

// Features Section loads immediately with loading fallback
const FeaturesSection = dynamic(
  () => import("@/components/landing-page/FeaturesSection").then(m => m.FeaturesSection),
  {
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
)

// Lazy load secondary sections without SSR
const SolutionsSection = dynamic(
  () => import("@/components/landing-page/SolutionsSection").then(m => m.SolutionsSection),
  {}
)

const PlatformSection = dynamic(
  () => import("@/components/landing-page/PlatformSection").then(m => m.PlatformSection),
  {}
)

const HowItWorksSection = dynamic(
  () => import("@/components/landing-page/HowItWorksSection").then(m => m.HowItWorksSection),
  {}
)

const FreeToolsSection = dynamic(
  () => import("@/components/landing-page/FreeToolsSection").then(m => m.FreeToolsSection),
  {}
)

const SiteFooter = dynamic(
  () => import("@/components/landing-page/SiteFooter").then(m => m.SiteFooter),
  {}
)

export function LandingPageClient() {
  return (
    <>
      {/* Evidence: Core Features -- load first with visible loading state */}
      <FeaturesSection />

      {/* Target: Industry Specifics */}
      <LazySection>
        <SolutionsSection />
      </LazySection>

      {/* Power: Unified Platform Deep-dive */}
      <LazySection>
        <PlatformSection />
      </LazySection>

      {/* Ease: Step-by-step Onboarding */}
      <LazySection>
        <HowItWorksSection />
      </LazySection>

      {/* Hook: Free Growth Tools */}
      <LazySection>
        <FreeToolsSection />
      </LazySection>

      <LazySection>
        <SiteFooter />
      </LazySection>
    </>
  )
}
