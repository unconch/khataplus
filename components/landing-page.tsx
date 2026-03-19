import { HeroSection } from "@/components/landing-page/HeroSection"
import { HeroShowcaseSection } from "@/components/landing-page/HeroShowcaseSection"
import { LandingPageClient } from "@/components/landing-page-client"

export function LandingPage({
  isAuthenticated,
  orgSlug,
  isGuest = false,
}: {
  isAuthenticated: boolean
  orgCount?: number
  orgSlug?: string | null
  isGuest?: boolean
}) {
  return (
    <main className="min-h-screen bg-[#fafafa] selection:bg-emerald-100 scroll-smooth">
      <HeroSection isAuthenticated={isAuthenticated} orgSlug={orgSlug} isGuest={isGuest} />
      <div className="hidden md:block">
        <HeroShowcaseSection />
      </div>
      <LandingPageClient />
    </main>
  )
}
