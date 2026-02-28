import { Navbar, PricingSection, PricingComparison, SiteFooter } from "@/components/landing-page/index"
import { getTotalOrganizationCount } from "@/lib/data/organizations"
import { getCurrentUser } from "@/lib/data/auth"

export const dynamic = "force-dynamic"

export default async function PricingPage() {
    let orgCount = 0
    let user: Awaited<ReturnType<typeof getCurrentUser>> = null

    try {
        orgCount = await getTotalOrganizationCount()
    } catch (error) {
        console.warn("[pricing] orgCount fetch failed, defaulting to 0", error)
    }

    try {
        user = await getCurrentUser()
    } catch (error) {
        console.warn("[pricing] user fetch failed, treating as anonymous", error)
        user = null
    }

    const isAuthenticated = !!user

    let orgSlug = null
    if (user && !user.isGuest) {
        try {
            const { getUserOrganizations } = await import("@/lib/data/organizations")
            const orgs = await getUserOrganizations(user.userId)
            orgSlug = orgs[0]?.organization?.slug || null
        } catch (error) {
            console.warn("[pricing] org lookup failed, skipping redirect slug", error)
        }
    }

    return (
        <main className="min-relative min-h-screen bg-white overflow-hidden">
            {/* Soft decorative background elements for Light Mode */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-50 rounded-full blur-[120px] opacity-60" />
                <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-blue-50 rounded-full blur-[100px] opacity-40" />
                <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] bg-emerald-50/30 rounded-full blur-[150px] opacity-50" />

                {/* Subtle pattern or noise if desired, but keep it clean */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
            </div>

            <div className="relative z-10 font-sans">
                <Navbar
                    isAuthenticated={isAuthenticated}
                    lightMode={true}
                    orgSlug={orgSlug}
                    isGuest={user?.isGuest}
                />
                <div className="pt-32 pb-20">
                    <PricingSection
                        orgCount={orgCount}
                        isAuthenticated={isAuthenticated}
                        orgSlug={orgSlug}
                    />
                    <PricingComparison />
                </div>
                <SiteFooter />
            </div>
        </main>
    )
}
