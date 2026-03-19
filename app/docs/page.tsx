import { Navbar, SiteFooter } from "@/components/landing-page/index"
import { getCurrentUser } from "@/lib/data/auth"
import { DocsHomeClient } from "./docs-home-client"
import { Copy, ChevronDown } from "lucide-react"

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
        <main className="min-h-screen bg-[#1c1c1c] text-zinc-300 selection:bg-zinc-700 selection:text-white pb-32">
            <Navbar
                isAuthenticated={isAuthenticated}
                lightMode={false}
                orgSlug={orgSlug}
                isGuest={user?.isGuest}
            />

            {/* Adjusting padding to account for fixed navbar, removing bottom borders */}
            <section className="pt-24 lg:pt-32">
                <div className="max-w-6xl mx-auto px-6 lg:px-8">

                    {/* Header Top - Title and Action */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                        <h1 className="text-3xl md:text-[40px] font-bold tracking-tight text-white flex items-center gap-4">
                            <span>👋</span> Welcome to KhataPlus Docs
                        </h1>

                        <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md border border-zinc-700 bg-transparent hover:bg-zinc-800 text-sm font-medium text-zinc-300 transition-colors shrink-0">
                            <Copy className="h-4 w-4 text-zinc-400" />
                            Copy page
                            <ChevronDown className="h-4 w-4 text-zinc-500 ml-1" />
                        </button>
                    </div>

                    {/* Main Content Area */}
                    <DocsHomeClient />
                </div>
            </section>
            {/* Removing the large SiteFooter for this specific exact match, docs usually have simple footers or none built-in to the main view, but we'll leave it out for the exact replica feel of the core content */}
        </main>
    )
}
