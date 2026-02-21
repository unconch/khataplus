"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { HeroSection } from "@/components/landing-page/HeroSection"

// Lazy load all other sections
const FreeToolsSection = dynamic(() => import("@/components/landing-page/FreeToolsSection").then(mod => mod.FreeToolsSection), { ssr: false })
const FeaturesSection = dynamic(() => import("@/components/landing-page/FeaturesSection").then(mod => mod.FeaturesSection), { ssr: false })
const SolutionsSection = dynamic(() => import("@/components/landing-page/SolutionsSection").then(mod => mod.SolutionsSection), { ssr: false })
const InfrastructureSection = dynamic(() => import("@/components/landing-page/InfrastructureSection").then(mod => mod.InfrastructureSection), { ssr: false })
const OfflineModeSection = dynamic(() => import("@/components/landing-page/OfflineModeSection").then(mod => mod.OfflineModeSection), { ssr: false })
const AnalyticsSection = dynamic(() => import("@/components/landing-page/AnalyticsSection").then(mod => mod.AnalyticsSection), { ssr: false })
const SecuritySection = dynamic(() => import("@/components/landing-page/SecuritySection").then(mod => mod.SecuritySection), { ssr: false })
const GstSection = dynamic(() => import("@/components/landing-page/GstSection").then(mod => mod.GstSection), { ssr: false })
const HowItWorksSection = dynamic(() => import("@/components/landing-page/HowItWorksSection").then(mod => mod.HowItWorksSection), { ssr: false })
const AdaptiveInterfaceSection = dynamic(() => import("@/components/landing-page/AdaptiveInterfaceSection").then(mod => mod.AdaptiveInterfaceSection), { ssr: false })
const FaqSection = dynamic(() => import("@/components/landing-page/FaqSection").then(mod => mod.FaqSection), { ssr: false })
const SiteFooter = dynamic(() => import("@/components/landing-page/SiteFooter").then(mod => mod.SiteFooter), { ssr: false })

export function LandingPage({ isAuthenticated, orgCount, orgSlug, isGuest }: { isAuthenticated: boolean, orgCount?: number, orgSlug?: string | null, isGuest?: boolean }) {

    return (
        <main className="min-h-screen bg-white">
            <HeroSection isAuthenticated={isAuthenticated} orgSlug={orgSlug} isGuest={isGuest} />

            <FreeToolsSection />
            <FeaturesSection />
            <SolutionsSection />
            <InfrastructureSection />
            <OfflineModeSection />
            <AnalyticsSection />
            <SecuritySection />
            <GstSection />
            <HowItWorksSection />
            <AdaptiveInterfaceSection />
            <FaqSection />
            <SiteFooter />
        </main>
    )
}
