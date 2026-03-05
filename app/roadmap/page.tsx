"use client"

import Link from "next/link"
import { ArrowLeft, Zap, Shield, Crown, Rocket, CheckCircle2, Clock, Calendar, Star, ChevronRight } from "lucide-react"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/ui/logo"
import Image from "next/image"

const roadmapData = [
    {
        phase: "Phase 1: Core",
        status: "Completed",
        title: "Solid Foundation",
        description: "The essential building blocks for complete digital ledger and inventory management.",
        icon: Shield,
        items: [
            { title: "Simplified GST Billing", date: "Jan 12", completed: true },
            { title: "Offline-First Engine", date: "Jan 28", completed: true },
            { title: "Digital Khata Ledger", date: "Feb 15", completed: true },
            { title: "Inventory Management", date: "Feb 22", completed: true },
            { title: "Real-time Sync", date: "Mar 05", completed: true }
        ],
        theme: "zinc"
    },
    {
        phase: "Phase 2: Scale",
        status: "In Progress",
        title: "Growth & Analysis",
        description: "Advanced tools to understand your business performance and engage customers directly.",
        icon: Zap,
        items: [
            { title: "WhatsApp Marketing", date: "Apr 10", completed: false },
            { title: "Stock Forecasting", date: "May 05", completed: false },
            { title: "Profit Analytics", date: "May 22", completed: false },
            { title: "Payment Links", date: "June 12", completed: false },
            { title: "Staff Permissions", date: "June 28", completed: false }
        ],
        current: true,
        theme: "emerald"
    },
    {
        phase: "Phase 3: Ecosystem",
        status: "Planned",
        title: "Retail Network",
        description: "Expanding beyond the single store to connect your entire retail ecosystem.",
        icon: Crown,
        items: [
            { title: "Online Storefront", date: "Aug 15", completed: false },
            { title: "Loyalty Program", date: "Sept 10", completed: false },
            { title: "Multi-Store Sync", date: "Oct 05", completed: false },
            { title: "Purchase Orders", date: "Oct 28", completed: false },
            { title: "Vendor Portal", date: "Nov 15", completed: false }
        ],
        theme: "blue"
    },
    {
        phase: "Phase 4: Future",
        status: "Research",
        title: "Intelligence",
        description: "AI-driven algorithms to automate your operations and unlock new revenue streams.",
        icon: Rocket,
        items: [
            { title: "AI Tax Assistant", date: "Dec 10", completed: false },
            { title: "Supply Chain Finance", date: "Jan 20", completed: false },
            { title: "B2B Marketplace", date: "Feb 08", completed: false },
            { title: "Sales Algorithms", date: "Feb 28", completed: false },
            { title: "Multi-Currency", date: "Mar 15", completed: false }
        ],
        theme: "indigo"
    }
]

export default function RoadmapPage() {
    return (
        <main className="min-h-screen bg-[#0a0a0a] text-zinc-100 selection:bg-emerald-500/30">
            {/* Header / Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-zinc-800/50 px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 group">
                        <Logo size={28} />
                        <span className="text-lg font-bold tracking-tight text-white">KhataPlus</span>
                    </Link>
                    <Link href="/" className="text-xs font-medium tracking-wide text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5">
                        <ArrowLeft size={16} />
                        Back Context
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-24 px-6 relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

                <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
                    <AdvancedScrollReveal variant="slideUp">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm">
                            <Calendar size={14} className="text-emerald-400" />
                            <span className="text-zinc-300 font-medium text-xs tracking-wide">Rollout Schedule 2026</span>
                        </div>
                    </AdvancedScrollReveal>

                    <AdvancedScrollReveal variant="slideUp" delay={100}>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-white leading-[1.1]">
                            Building the future of <br className="hidden md:block" />
                            <span className="text-emerald-400">KhataPlus.</span>
                        </h1>
                    </AdvancedScrollReveal>

                    <AdvancedScrollReveal variant="slideUp" delay={200}>
                        <p className="text-zinc-400 text-lg md:text-xl font-normal max-w-2xl mx-auto leading-relaxed">
                            A clear look at when each feature hits your dashboard. We're shipping fast to keep your business ahead.
                        </p>
                    </AdvancedScrollReveal>
                </div>
            </section>

            {/* Clean Timeline Section */}
            <section className="pb-32 px-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    {roadmapData.map((phase, i) => (
                        <AdvancedScrollReveal key={phase.phase} variant="slideUp" delay={i * 100}>
                            <div className={cn(
                                "group relative flex flex-col md:flex-row gap-6 md:gap-8 rounded-2xl border p-6 md:p-8 transition-all duration-300",
                                phase.current
                                    ? "bg-zinc-900/80 border-emerald-500/30 shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20"
                                    : "bg-zinc-900/30 border-zinc-800/80 hover:bg-zinc-900/50 hover:border-zinc-700"
                            )}>
                                {/* Current Indicator Glow */}
                                {phase.current && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
                                )}

                                {/* Left Column: Phase Info */}
                                <div className="md:w-1/3 flex flex-col space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "flex items-center justify-center w-10 h-10 rounded-xl border",
                                            phase.status === "Completed" ? "bg-zinc-800 border-zinc-700 text-zinc-300" :
                                                phase.current ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                                                    "bg-zinc-900 border-zinc-800 text-zinc-500"
                                        )}>
                                            <phase.icon size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-0.5">{phase.phase}</p>
                                            <div className="flex items-center gap-1.5">
                                                {phase.status === "Completed" ? (
                                                    <CheckCircle2 size={12} className="text-zinc-400" />
                                                ) : (
                                                    <Clock size={12} className={phase.current ? "text-emerald-400" : "text-zinc-500"} />
                                                )}
                                                <span className={cn(
                                                    "text-sm font-medium",
                                                    phase.current ? "text-emerald-400" : "text-zinc-400"
                                                )}>
                                                    {phase.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-2 text-left">
                                        <h3 className="text-2xl font-semibold tracking-tight text-white">{phase.title}</h3>
                                        <p className="text-zinc-400 text-sm mt-2 leading-relaxed pr-4">
                                            {phase.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Right Column: Line Items */}
                                <div className="md:w-2/3 md:pl-8 md:border-l border-zinc-800/50 flex flex-col justify-center">
                                    <div className="space-y-4">
                                        {phase.items.map((item, j) => (
                                            <div key={j} className="flex items-center justify-between group/item">
                                                <div className="flex items-center gap-3">
                                                    {item.completed ? (
                                                        <CheckCircle2 size={16} className="text-zinc-500 group-hover/item:text-zinc-400 transition-colors" />
                                                    ) : (
                                                        <div className={cn(
                                                            "w-1.5 h-1.5 rounded-full ml-1",
                                                            phase.current ? "bg-emerald-500" : "bg-zinc-700"
                                                        )} />
                                                    )}
                                                    <span className={cn(
                                                        "text-[15px] font-medium transition-colors",
                                                        item.completed ? "text-zinc-500 line-through decoration-zinc-800" : "text-zinc-200 group-hover/item:text-white"
                                                    )}>
                                                        {item.title}
                                                    </span>
                                                </div>
                                                <span className="text-zinc-500 font-mono text-sm group-hover/item:text-zinc-400 transition-colors">
                                                    {item.date}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </AdvancedScrollReveal>
                    ))}
                </div>
            </section>

            {/* Feedback / CTA Section */}
            <section className="py-24 px-6 border-t border-zinc-900 bg-zinc-950 text-center relative overflow-hidden">
                <div className="max-w-2xl mx-auto space-y-8 relative z-10">
                    <AdvancedScrollReveal variant="slideUp">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 mb-6">
                            <Star size={20} className="text-emerald-400" fill="currentColor" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
                            Shape our future
                        </h2>
                        <p className="text-zinc-400 text-lg leading-relaxed mb-8">
                            Missing a feature you need? We prioritize our roadmap based on what matters most to you.
                        </p>
                        <Link
                            href="mailto:hello@khataplus.com"
                            className="inline-flex items-center justify-center gap-2 bg-white text-zinc-950 px-6 py-3 rounded-lg font-medium text-sm hover:bg-zinc-100 transition-all border border-transparent hover:border-white shadow-xl"
                        >
                            Request a Feature
                            <ChevronRight size={16} className="text-zinc-500" />
                        </Link>
                    </AdvancedScrollReveal>
                </div>
            </section>

            {/* Clean Footer */}
            <footer className="py-8 px-6 border-t border-zinc-900 bg-[#0a0a0a]">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-zinc-500 text-xs font-medium">
                        &copy; 2026 KhataPlus Inc. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <Link href="/privacy" className="text-zinc-500 hover:text-zinc-300 text-xs font-medium transition-colors">Privacy</Link>
                        <Link href="/terms" className="text-zinc-500 hover:text-zinc-300 text-xs font-medium transition-colors">Terms</Link>
                    </div>
                </div>
            </footer>
        </main>
    )
}
