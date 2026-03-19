import dynamic from "next/dynamic"
import { LazySection } from "@/components/lazy-section"

const FeaturesSection = dynamic(() => import("@/components/landing-page/FeaturesSection").then((m) => m.FeaturesSection))
const SolutionsSection = dynamic(() => import("@/components/landing-page/SolutionsSection").then((m) => m.SolutionsSection))
const PlatformSection = dynamic(() => import("@/components/landing-page/PlatformSection").then((m) => m.PlatformSection))
const HowItWorksSection = dynamic(() => import("@/components/landing-page/HowItWorksSection").then((m) => m.HowItWorksSection))
const FreeToolsSection = dynamic(() => import("@/components/landing-page/FreeToolsSection").then((m) => m.FreeToolsSection))
const SiteFooter = dynamic(() => import("@/components/landing-page/SiteFooter").then((m) => m.SiteFooter))

export function LandingPageClient() {
  return (
    <>
      {/* Evidence: Core Features -- load first with visible loading state */}
      <LazySection>
        <FeaturesSection />
      </LazySection>

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
