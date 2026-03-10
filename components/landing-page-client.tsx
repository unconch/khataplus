import { LazySection } from "@/components/lazy-section"
import { FeaturesSection } from "@/components/landing-page/FeaturesSection"
import { FreeToolsSection } from "@/components/landing-page/FreeToolsSection"
import { HowItWorksSection } from "@/components/landing-page/HowItWorksSection"
import { PlatformSection } from "@/components/landing-page/PlatformSection"
import { SiteFooter } from "@/components/landing-page/SiteFooter"
import { SolutionsSection } from "@/components/landing-page/SolutionsSection"

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
