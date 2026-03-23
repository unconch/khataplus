import { getCurrentUser } from "@/lib/data/auth"
import { DocsHomeClient } from "./docs-home-client"
import { DocsNavbar } from "./docs-navbar"

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
        <main className="min-h-screen bg-transparent pb-32">
            <DocsNavbar
                isAuthenticated={isAuthenticated}
                orgSlug={orgSlug}
                isGuest={user?.isGuest}
            />

            {/* Adjusting padding to account for fixed navbar, removing bottom borders */}
            <section className="pt-28 lg:pt-32">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <DocsHomeClient />
                </div>
            </section>
        </main>
    )
}
