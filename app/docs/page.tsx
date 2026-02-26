import { Navbar, SiteFooter, FaqSection } from "@/components/landing-page/index"
import { getCurrentUser } from "@/lib/data/auth"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"
import { GraduationCap, MessageSquare } from "lucide-react"
import Link from "next/link"
import { AcademyContentClient } from "./academy-client"

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
        <main className="min-h-screen bg-white overflow-hidden selection:bg-emerald-500 selection:text-white">
            <Navbar
                isAuthenticated={isAuthenticated}
                lightMode={false}
                orgSlug={orgSlug}
                isGuest={user?.isGuest}
            />

            {/* Hero Section */}
            <section className="relative pt-24 pb-16 md:pt-32 md:pb-20 bg-zinc-950 overflow-hidden">
                <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[length:40px_40px]" />

                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <AdvancedScrollReveal variant="slideUp">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
                                <GraduationCap size={12} className="text-emerald-400" />
                                <span className="text-emerald-400 font-black text-[8px] tracking-widest uppercase">Academy v2.0</span>
                            </div>

                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white leading-[0.85]">
                                Learn. Grow. <span className="text-zinc-600 italic">Dominate.</span>
                            </h1>

                            <p className="text-zinc-400 text-base md:text-lg font-medium max-w-xl mx-auto leading-relaxed">
                                Definitive guides to build a modern empire with KhataPlus.
                            </p>

                            <AcademyContentClient
                                isAuthenticated={isAuthenticated}
                                orgSlug={orgSlug}
                            />
                        </div>
                    </AdvancedScrollReveal>
                </div>
            </section>

            <FaqSection />



            <SiteFooter />
        </main>
    )
}
