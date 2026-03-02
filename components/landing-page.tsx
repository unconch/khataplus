"use client"

import dynamic from "next/dynamic"
import { HeroSection } from "@/components/landing-page/HeroSection"
export { Navbar } from "@/components/landing-page/Navbar"

// Lazy load all other sections to optimize initial bundle
const FreeToolsSection = dynamic(() => import("@/components/landing-page/FreeToolsSection").then(mod => mod.FreeToolsSection), { ssr: false })
const FeaturesSection = dynamic(() => import("@/components/landing-page/FeaturesSection").then(mod => mod.FeaturesSection), { ssr: false })
const SolutionsSection = dynamic(() => import("@/components/landing-page/SolutionsSection").then(mod => mod.SolutionsSection), { ssr: false })
const PlatformSection = dynamic(() => import("@/components/landing-page/PlatformSection").then(mod => mod.PlatformSection), { ssr: false })
const HowItWorksSection = dynamic(() => import("@/components/landing-page/HowItWorksSection").then(mod => mod.HowItWorksSection), { ssr: false })
const MarqueeSection = dynamic(() => import("@/components/landing-page/MarqueeSection").then(mod => mod.MarqueeSection), { ssr: false })
const SiteFooter = dynamic(() => import("@/components/landing-page/SiteFooter").then(mod => mod.SiteFooter), { ssr: false })

export function LandingPage({ isAuthenticated, orgSlug, isGuest }: { isAuthenticated: boolean, orgCount?: number, orgSlug?: string | null, isGuest?: boolean }) {
    return (
        <main className="min-h-screen bg-[#fafafa] selection:bg-emerald-100 scroll-smooth">
            <HeroSection isAuthenticated={isAuthenticated} orgSlug={orgSlug} isGuest={isGuest} />

            {/* Kinetic Scrolling Marquee */}
            <MarqueeSection />

            {/* Evidence: Core Features */}
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
        </main>
    )
}
