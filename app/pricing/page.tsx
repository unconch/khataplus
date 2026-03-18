import { Navbar, PricingSection, PricingComparison, SiteFooter } from "@/components/landing-page/index"
import { getTotalOrganizationCount } from "@/lib/data/organizations"

export const dynamic = "force-static"

export default async function PricingPage() {
    let orgCount = 0

    try {
        orgCount = await getTotalOrganizationCount()
    } catch (error) {
        console.warn("[pricing] orgCount fetch failed, defaulting to 0", error)
    }

    return (
        <main className="relative min-h-screen bg-white overflow-hidden">
            {/* Soft decorative background elements for Light Mode */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 hero-glow-light hero-gradient-motion" />

                {/* Subtle pattern or noise if desired, but keep it clean */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
            </div>

            <div className="relative z-10 font-sans">
                <Navbar
                    isAuthenticated={false}
                    lightMode={true}
                    orgSlug={null}
                    isGuest={false}
                />
                <div className="pt-32 pb-20">
                    <PricingSection
                        orgCount={orgCount}
                        isAuthenticated={false}
                        orgSlug={null}
                    />
                    <PricingComparison />
                </div>
                <SiteFooter />
            </div>
        </main>
    )
}
