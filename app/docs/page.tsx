import { Navbar, SiteFooter, FaqSection } from "@/components/landing-page/index"
import { getCurrentUser } from "@/lib/data/auth"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import {
    BookOpen, ShoppingBag, ShieldCheck, Smartphone,
    Zap, MessageSquare, ArrowRight, Search,
    FileText, HelpCircle, GraduationCap
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

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

    return (
        <main className="min-h-screen bg-white overflow-hidden selection:bg-emerald-500 selection:text-white">
            <Navbar
                isAuthenticated={!!user}
                lightMode={false}
                orgSlug={orgSlug}
                isGuest={user?.isGuest}
            />

            {/* Hero Section - The Knowledge Vault (Reduced) */}
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

                            {/* Ultra Compact Search */}
                            <div className="max-w-md mx-auto relative group mt-8">
                                <div className="absolute inset-0 bg-emerald-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                                <div className="relative flex items-center">
                                    <Search size={18} className="absolute left-5 text-zinc-500 group-hover:text-emerald-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search the academy..."
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm font-medium text-white focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all backdrop-blur-2xl"
                                    />
                                    <div className="absolute right-4 hidden md:block">
                                        <div className="px-2 py-0.5 bg-white/10 rounded border border-white/5 text-[8px] font-black text-zinc-400">CMD+K</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </AdvancedScrollReveal>
                </div>
            </section>

            {/* Core Modules Grid (Tight) */}
            <section className="py-16 px-6 bg-zinc-50">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-end mb-12 gap-8">
                        <div className="space-y-1">
                            <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-zinc-950 italic">The Curriculum.</h2>
                            <p className="text-zinc-500 text-sm font-medium">Structured learning paths for every scale.</p>
                        </div>
                        <button className="px-5 py-2.5 rounded-full bg-white border border-zinc-200 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-950 transition-colors">
                            Filters
                        </button>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AcademyModule
                            icon={ShoppingBag}
                            title="Inventory Mastery"
                            desc="Managing 10,000+ SKUs with variants and automated reorder points."
                            lessons={["Barcode Logic", "Bulk Imports"]}
                            progress={100}
                            color="emerald"
                        />
                        <AcademyModule
                            icon={ShieldCheck}
                            title="Compliance & Tax"
                            desc="GST filing, HSN codes, and staying audit-ready in India."
                            lessons={["GST Config", "HSN Mapping"]}
                            progress={85}
                            color="blue"
                        />
                        <AcademyModule
                            icon={Smartphone}
                            title="The PWA Edge"
                            desc="Mastering offline-first workflows and storefronts."
                            lessons={["Offline Entry", "Home Install"]}
                            progress={40}
                            color="rose"
                        />
                        <AcademyModule
                            icon={Zap}
                            title="Staff Excellence"
                            desc="Managing permissions and performance analytics."
                            lessons={["Role-based Access", "Staff Stats"]}
                            progress={0}
                            color="amber"
                        />
                        <AcademyModule
                            icon={FileText}
                            title="Advanced BI"
                            desc="Cashflow forecasting and multi-store views."
                            lessons={["P&L Analysis", "Cashflow AI"]}
                            progress={0}
                            color="indigo"
                        />
                        <AcademyModule
                            icon={HelpCircle}
                            title="Scenario Solver"
                            desc="Handling edge cases: Returns and credit deletions."
                            lessons={["Refund Logic", "Udhaar Cleaning"]}
                            progress={0}
                            color="cyan"
                        />
                    </div>
                </div>
            </section>

            <FaqSection />

            {/* Premium Support (Tight) */}
            <section className="py-20 px-6 bg-zinc-950 text-white overflow-hidden relative">
                <div className="max-w-4xl mx-auto relative z-10">
                    <div className="flex flex-col items-center text-center space-y-8">
                        <div className="w-16 h-16 rounded-2xl bg-white text-zinc-950 flex items-center justify-center rotate-3 hover:rotate-0 transition-transform duration-500">
                            <MessageSquare size={28} />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl md:text-4xl font-black tracking-tighter italic uppercase">Human Support.</h2>
                            <p className="text-zinc-500 text-base font-medium max-w-lg mx-auto leading-relaxed">
                                Our academy covers 99.9% of cases. For the rest, experts are standing by.
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="px-8 py-4 rounded-2xl bg-emerald-600 text-white font-black uppercase tracking-widest text-[9px] hover:bg-emerald-500 transition-all">
                                Schedule session
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <SiteFooter />
        </main>
    )
}

function AcademyModule({ icon: Icon, title, desc, lessons, progress, color }: any) {
    const colorMap: any = {
        emerald: "text-emerald-500 bg-emerald-50",
        blue: "text-blue-500 bg-blue-50",
        rose: "text-rose-500 bg-rose-50",
        amber: "text-amber-500 bg-amber-50",
        indigo: "text-indigo-500 bg-indigo-50",
        cyan: "text-cyan-500 bg-cyan-50"
    }

    const barColor: any = {
        emerald: "bg-emerald-500",
        blue: "bg-blue-500",
        rose: "bg-rose-500",
        amber: "bg-amber-500",
        indigo: "bg-indigo-500",
        cyan: "bg-cyan-500"
    }

    return (
        <div className="p-6 rounded-[2rem] bg-white border border-zinc-100 hover:shadow-xl transition-all duration-700 group flex flex-col h-full">
            <div className="flex justify-between items-start mb-6">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-sm", colorMap[color])}>
                    <Icon size={20} />
                </div>
                {progress > 0 && (
                    <div className="px-2 py-0.5 bg-zinc-50 rounded-full border border-zinc-100 text-[8px] font-black uppercase text-zinc-400">
                        {progress}%
                    </div>
                )}
            </div>

            <div className="space-y-2 flex-1">
                <h3 className="text-xl font-black italic tracking-tighter text-zinc-950 leading-none uppercase">{title}</h3>
                <p className="text-zinc-500 text-xs font-medium leading-relaxed">{desc}</p>
            </div>

            <div className="mt-8 space-y-4">
                <div className="space-y-2">
                    {lessons.map((lesson: string, i: number) => (
                        <div key={i} className="flex items-center justify-between text-[10px] font-bold text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer group/lesson">
                            <span>{lesson}</span>
                            <ArrowRight size={10} className="opacity-0 group-hover/lesson:opacity-100 -translate-x-2 transition-all text-emerald-500" />
                        </div>
                    ))}
                </div>

                {progress > 0 && (
                    <div className="h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
                        <div
                            className={cn("h-full transition-all duration-1000", barColor[color])}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}

                <button className="w-full py-3 rounded-xl bg-zinc-950 text-white font-black uppercase tracking-widest text-[8px] hover:bg-emerald-600 transition-colors">
                    Start
                </button>
            </div>
        </div>
    )
}
