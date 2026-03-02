import { Navbar, SiteFooter } from "@/components/landing-page/index"
import { getCurrentUser } from "@/lib/data/auth"
import { DocsHomeClient } from "./docs-home-client"

export default async function DocsPage() {
    let user: Awaited<ReturnType<typeof getCurrentUser>> = null

    try {
        user = await getCurrentUser()
    } catch {
        user = null
    }

    let orgSlug: string | null = null
    if (user && !user.isGuest) {
        try {
            const { getUserOrganizations } = await import("@/lib/data/organizations")
            const orgs = await getUserOrganizations(user.userId)
            orgSlug = orgs[0]?.organization?.slug || null
        } catch {
            orgSlug = null
        }
    }

    const isAuthenticated = !!user

    return (
        <main className="min-h-screen bg-white overflow-hidden selection:bg-green-500 selection:text-white">
            <Navbar
                isAuthenticated={isAuthenticated}
                lightMode={true}
                orgSlug={orgSlug}
                isGuest={user?.isGuest}
            />

            <section className="pt-14 pb-6 md:pt-16 md:pb-8 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="space-y-4 text-left">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-zinc-900">
                                KhataPlus Documentation
                            </h1>
                            <p className="mt-2 text-sm md:text-base text-zinc-600">
                                Guides for billing, khata, inventory, GST and team workflows.
                            </p>
                        </div>
                        <DocsHomeClient />
                    </div>
                </div>
            </section>

            <SiteFooter />
        </main>
    )
}
