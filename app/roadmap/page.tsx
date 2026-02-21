"use client"

import Link from "next/link"
import { ArrowLeft, Sparkles, Zap, Shield, Crown, Rocket, CheckCircle2, Clock, Calendar, Star } from "lucide-react"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/ui/logo"

const roadmapData = [
    {
        phase: "Phase 1: Core",
        status: "Completed",
        title: "Solid Foundation",
        icon: Shield,
        items: [
            { title: "Simplified GST Billing", date: "Jan 12" },
            { title: "Offline-First Engine", date: "Jan 28" },
            { title: "Digital Khata Ledger", date: "Feb 15" },
            { title: "Inventory Management", date: "Feb 22" },
            { title: "Real-time Sync", date: "Mar 05" }
        ],
        color: "zinc"
    },
    {
        phase: "Phase 2: Scale",
        status: "In Progress",
        title: "Growth & Analysis",
        icon: Zap,
        items: [
            { title: "WhatsApp Marketing", date: "Apr 10" },
            { title: "Stock Forecasting", date: "May 05" },
            { title: "Profit Analytics", date: "May 22" },
            { title: "Payment Links", date: "June 12" },
            { title: "Staff Permissions", date: "June 28" }
        ],
        current: true,
        color: "emerald"
    },
    {
        phase: "Phase 3: Ecosystem",
        status: "Development",
        title: "Retail Network",
        icon: Crown,
        items: [
            { title: "Online Storefront", date: "Aug 15" },
            { title: "Loyalty Program", date: "Sept 10" },
            { title: "Multi-Store Sync", date: "Oct 05" },
            { title: "Purchase Orders", date: "Oct 28" },
            { title: "Vendor Portal", date: "Nov 15" }
        ],
        color: "blue"
    },
    {
        phase: "Phase 4: Future",
        status: "Research",
        title: "Intelligence",
        icon: Rocket,
        items: [
            { title: "AI Tax Assistant", date: "Dec 10" },
            { title: "Supply Chain Finance", date: "Jan 20" },
            { title: "B2B Marketplace", date: "Feb 08" },
            { title: "Sales Algorithms", date: "Feb 28" },
            { title: "Multi-Currency", date: "Mar 15" }
        ],
        color: "indigo"
    }
]

export default function RoadmapPage() {
    return (
        <main className="min-h-screen bg-white text-zinc-900 selection:bg-emerald-100">
            {/* Header / Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-100 px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 group">
                        <Logo size={32} />
                        <span className="text-xl font-black tracking-tighter text-zinc-950">KhataPlus</span>
                    </Link>
                    <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-950 transition-colors flex items-center gap-2">
                        <ArrowLeft size={14} />
                        Back to Home
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-50 opacity-[0.05] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />

                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <AdvancedScrollReveal variant="slideUp">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200/50">
                            <Calendar size={12} className="text-emerald-500" />
                            <span className="text-zinc-600 font-black text-[9px] tracking-widest uppercase">Rollout Schedule 2026</span>
                        </div>
                    </AdvancedScrollReveal>

                    <AdvancedScrollReveal variant="slideUp" delay={100}>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-zinc-900 leading-[0.85] uppercase italic">
                            Planned <br />
                            <span className="text-zinc-400">Milestones.</span>
                        </h1>
                    </AdvancedScrollReveal>

                    <AdvancedScrollReveal variant="slideUp" delay={200}>
                        <p className="text-zinc-500 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                            A clear look at when each feature hits your dashboard. We're shipping fast to keep your business ahead.
                        </p>
                    </AdvancedScrollReveal>
                </div>
            </section>

            {/* Roadmap Timeline */}
            <section className="pb-32 px-6">
                <div className="max-w-5xl mx-auto relative">
                    {/* Vertical Line */}
                    <div className="absolute left-[20px] md:left-1/2 top-0 bottom-0 w-px bg-zinc-100 -translate-x-1/2 hidden md:block" />

                    <div className="space-y-12 md:space-y-24">
                        {roadmapData.map((phase, i) => (
                            <AdvancedScrollReveal
                                key={phase.phase}
                                variant={i % 2 === 0 ? "slideRight" : "slideLeft"}
                                className={cn(
                                    "relative grid md:grid-cols-2 gap-8 md:gap-24 items-center",
                                    i % 2 !== 0 && "md:text-right"
                                )}
                            >
                                {/* Timeline Dot */}
                                <div className={cn(
                                    "absolute left-[20px] md:left-1/2 top-0 w-8 h-8 rounded-full border-4 border-white shadow-xl z-20 -translate-x-1/2 items-center justify-center hidden md:flex",
                                    phase.current ? "bg-emerald-500 animate-pulse" : "bg-zinc-200"
                                )}>
                                    <phase.icon size={12} className={phase.current ? "text-white" : "text-zinc-400"} />
                                </div>

                                <div className={cn(
                                    "space-y-6",
                                    i % 2 !== 0 ? "md:order-2" : "md:order-1"
                                )}>
                                    <div className={cn(
                                        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase",
                                        phase.status === "Completed" ? "bg-emerald-50 text-emerald-600" :
                                            phase.status === "In Progress" ? "bg-blue-50 text-blue-600" :
                                                "bg-zinc-100 text-zinc-600"
                                    )}>
                                        {phase.status === "Completed" ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                                        {phase.phase} • {phase.status}
                                    </div>
                                    <h3 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase text-zinc-900 leading-none">
                                        {phase.title}
                                    </h3>
                                    <div className={cn(
                                        "space-y-4",
                                        i % 2 !== 0 && "md:items-end flex flex-col"
                                    )}>
                                        {phase.items.map((item, j) => (
                                            <div key={j} className="flex flex-col group">
                                                <div className={cn(
                                                    "flex items-center gap-3",
                                                    i % 2 !== 0 && "md:flex-row-reverse"
                                                )}>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    <span className="text-zinc-950 font-black uppercase text-[11px] tracking-tight">{item.title}</span>
                                                    <span className="text-zinc-300 font-mono text-[9px] font-bold">{item.date}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className={cn(
                                    "hidden md:block relative group",
                                    i % 2 !== 0 ? "md:order-1" : "md:order-2"
                                )}>
                                    <div className={cn(
                                        "aspect-video rounded-[2.5rem] bg-zinc-50 border border-zinc-100 overflow-hidden relative shadow-sm transition-all duration-700 group-hover:shadow-2xl group-hover:-translate-y-2",
                                        phase.current && "ring-1 ring-emerald-500/30"
                                    )}>
                                        {/* Abstract Visual Pattern */}
                                        <div className="absolute inset-0 opacity-[0.4]">
                                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,#10b981_0%,transparent_50%)] opacity-10" />
                                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,#3b82f6_0%,transparent_50%)] opacity-10" />
                                            <div className="grid grid-cols-6 h-full gap-px p-px">
                                                {Array.from({ length: 24 }).map((_, k) => (
                                                    <div key={k} className="bg-zinc-100/50 rounded-lg animate-pulse" style={{ animationDelay: `${k * 100}ms` }} />
                                                ))}
                                            </div>
                                        </div>

                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="p-8 bg-white rounded-3xl border border-zinc-100 shadow-xl scale-95 transition-transform group-hover:scale-100 duration-700">
                                                <phase.icon className={cn(
                                                    "w-12 h-12",
                                                    phase.color === "emerald" ? "text-emerald-500" :
                                                        phase.color === "blue" ? "text-blue-500" :
                                                            phase.color === "indigo" ? "text-indigo-500" :
                                                                "text-zinc-500"
                                                )} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </AdvancedScrollReveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* Feedback Section */}
            <section className="py-32 px-6 bg-zinc-950 text-white text-center relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500 opacity-[0.1] blur-[100px] rounded-full" />

                <div className="max-w-3xl mx-auto space-y-12 relative z-10">
                    <AdvancedScrollReveal variant="slideUp">
                        <div className="inline-flex items-center gap-2 text-emerald-400 font-black text-[9px] uppercase tracking-widest">
                            <Star size={12} fill="currentColor" />
                            Community Driven
                        </div>
                    </AdvancedScrollReveal>

                    <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-[0.9]">
                        Your feedback defines <br />
                        <span className="text-zinc-600">Our future.</span>
                    </h2>

                    <p className="text-zinc-400 text-lg font-medium">
                        Missing a feature you need? We prioritize our roadmap based on what matters most to our business owners. Let us know how we can help you grow.
                    </p>

                    <Link href="mailto:hello@khataplus.com" className="inline-flex items-center gap-4 bg-white text-zinc-950 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-400 transition-all hover:scale-105 active:scale-95 shadow-2xl">
                        Request a Feature
                    </Link>
                </div>
            </section>

            {/* Footer Copy */}
            <footer className="py-12 px-6 text-center border-t border-zinc-100">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">
                        &copy; 2026 KhataPlus Inc. All rights reserved.
                    </p>
                    <div className="flex gap-8">
                        <Link href="/privacy" className="text-zinc-400 hover:text-zinc-950 text-[10px] font-black uppercase tracking-widest transition-colors">Privacy</Link>
                        <Link href="/terms" className="text-zinc-400 hover:text-zinc-950 text-[10px] font-black uppercase tracking-widest transition-colors">Terms</Link>
                    </div>
                </div>
            </footer>
        </main>
    )
}
