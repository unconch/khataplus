import dynamic from "next/dynamic"
import { HeroSection } from "@/components/landing-page/HeroSection"

const LandingPageClient = dynamic(
  () => import("@/components/landing-page-client").then(m => m.LandingPageClient),
  { ssr: false }
)

const HeroShowcaseSection = dynamic(
  () => import("@/components/landing-page/HeroShowcaseSection").then(m => m.HeroShowcaseSection),
  {
    ssr: false,
    loading: () => (
      <section className="relative py-8 md:py-10 bg-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="h-10 md:h-14 w-4/5 mx-auto bg-zinc-200/70 rounded-2xl animate-pulse" />
          <div className="h-6 md:h-8 w-3/5 mx-auto bg-zinc-200/50 rounded-2xl mt-4 animate-pulse" />
          <div className="mt-8 h-[360px] md:h-[520px] w-full rounded-[2.5rem] bg-white/40 border border-zinc-200/60 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.2)] animate-pulse" />
        </div>
      </section>
    ),
  }
)

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
      <HeroShowcaseSection />
      <LandingPageClient />
    </main>
  )
}
