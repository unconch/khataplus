import { HeroSection } from "@/components/landing-page/HeroSection"
import { HeroShowcaseSection } from "@/components/landing-page/HeroShowcaseSection"
import { LandingPageClient } from "@/components/landing-page-client"

export function LandingPage({ isAuthenticated, orgSlug }: { isAuthenticated: boolean, orgCount?: number, orgSlug?: string | null }) {
  return (
    <main className="min-h-screen bg-[#fafafa] selection:bg-emerald-100 scroll-smooth">
      <HeroSection isAuthenticated={isAuthenticated} orgSlug={orgSlug} isGuest={false} />
      <HeroShowcaseSection />
      <LandingPageClient />
    </main>
  )
}
