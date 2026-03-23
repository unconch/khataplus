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
        <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.32),transparent_28%),radial-gradient(circle_at_top_right,rgba(37,99,235,0.24),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.14),transparent_24%),linear-gradient(180deg,#dcefe5_0%,#e5eefb_34%,#e2ebfb_68%,#dde7f8_100%)]">
            {/* Whole-page subtle color field that fades out toward the bottom */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div
                    className="absolute inset-0"
                    style={{
                        maskImage: "linear-gradient(to bottom, black 0%, black 72%, transparent 100%)",
                        WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 72%, transparent 100%)"
                    }}
                >
                    <div className="absolute -left-32 top-0 h-[520px] w-[520px] rounded-full bg-emerald-500/24 blur-[150px]" />
                    <div className="absolute right-[-180px] top-24 h-[560px] w-[560px] rounded-full bg-sky-500/22 blur-[170px]" />
                    <div className="absolute left-1/2 top-[45%] h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-violet-400/18 blur-[210px]" />
                    <div className="absolute left-[12%] top-[42%] h-[340px] w-[340px] rounded-full bg-amber-400/14 blur-[140px]" />
                </div>

                {/* Very light texture so gradients don't feel flat */}
                <div className="absolute inset-0 opacity-[0.02] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            </div>

            <div className="relative z-10 font-sans">
                <Navbar
                    isAuthenticated={isAuthenticated}
                    lightMode={true}
                    orgSlug={orgSlug}
                    isGuest={user?.isGuest}
                    forcePublicActions={true}
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
