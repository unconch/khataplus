import { notFound } from "next/navigation"
import { Navbar, SiteFooter } from "@/components/landing-page/index"
import { getCurrentUser } from "@/lib/data/auth"
import { DOC_BY_SLUG, DOC_ARTICLES } from "../docs-data"
import { DocArticleClient } from "../doc-article-client"
import { DocsSidebarClient } from "../docs-sidebar-client"

export function generateStaticParams() {
    return DOC_ARTICLES.map((doc) => ({ section: doc.slug }))
}

export default async function DocArticlePage({ params }: { params: Promise<{ section: string }> }) {
    const { section } = await params

    if (!DOC_BY_SLUG[section]) {
        notFound()
    }

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
        <main className="min-h-screen bg-zinc-950 selection:bg-emerald-500/30 selection:text-emerald-200">
            <Navbar
                isAuthenticated={isAuthenticated}
                lightMode={false}
                orgSlug={orgSlug}
                isGuest={user?.isGuest}
            />

            <div className="flex">
                <DocsSidebarClient />
                <section className="flex-1 bg-zinc-950 min-w-0">
                    <DocArticleClient slug={section} />
                </section>
            </div>

            <div className="border-t border-zinc-900 bg-zinc-950">
                <SiteFooter />
            </div>
        </main>
    )
}
