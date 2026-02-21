"use client"

import { Store, Truck, Briefcase, HandCoins, ArrowRight, Zap, Target } from "lucide-react"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { BentoGrid, BentoCard } from "@/components/bento-grid"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function SolutionsSection() {
    return (
        <section id="solutions" className="py-16 md:py-20 px-6 bg-zinc-950 text-white relative overflow-hidden">
            {/* Architectural Grid Background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:40px_40px]" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col lg:flex-row items-end justify-between mb-12 md:mb-16 gap-8">
                    <AdvancedScrollReveal variant="slideRight">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                <Target size={12} className="text-emerald-400" />
                                <span className="text-emerald-400 font-black text-[9px] tracking-widest uppercase text-white/70">Industry Solutions</span>
                            </div>
                            <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9] uppercase italic">
                                Built for <br />
                                <span className="text-zinc-600">Every Industry.</span>
                            </h2>
                        </div>
                    </AdvancedScrollReveal>

                    <AdvancedScrollReveal variant="fadeIn" delay={300}>
                        <p className="text-zinc-500 text-base max-w-sm font-medium leading-relaxed">
                            One app, infinite possibilities. We've tailored KhataPlus to solve the specific needs of modern business.
                        </p>
                    </AdvancedScrollReveal>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-12 gap-5 auto-rows-[240px] md:auto-rows-[260px]">
                    <SolutionCard
                        className="lg:col-span-7 lg:row-span-1"
                        icon={Store}
                        title="Retail & Kirana"
                        tagline="Fast Billing, No Waiting."
                        description="Lightning-fast billing with barcode support, automated stock alerts, and WhatsApp reminders that recover credit 2x faster."
                        color="emerald"
                        dataPoints={["Barcode Ready", "Auto Ledger"]}
                    />
                    <SolutionCard
                        className="lg:col-span-5 lg:row-span-1"
                        icon={Briefcase}
                        title="Services"
                        tagline="Advanced Analytics."
                        description="Professional tax invoices for service firms, detailed expense tracking, and clear reports for your business growth."
                        color="blue"
                        dataPoints={["Tax Ready", "P&L Docs"]}
                    />
                    <SolutionCard
                        className="lg:col-span-5 lg:row-span-1"
                        icon={HandCoins}
                        title="Credit Tracking"
                        tagline="Digital Credit Ledger."
                        description="The end of paper registers. Clear, safe, and transparent credit tracking for all your loyal customers."
                        color="amber"
                        dataPoints={["Secure Ledger", "1-Tap SMS"]}
                    />
                    <SolutionCard
                        className="lg:col-span-7 lg:row-span-1"
                        icon={Truck}
                        title="Wholesale"
                        tagline="Enterprise Distribution."
                        description="Manage massive inventory volumes, track supplier payouts, and handle volume-based pricing with ease."
                        color="indigo"
                        dataPoints={["Multi-store", "Bulk Price"]}
                    />


                </div>

                <AdvancedScrollReveal variant="slideUp" delay={400}>
                    <div className="mt-12 p-8 lg:p-12 rounded-[2.5rem] liquid-glass border border-white/10 relative overflow-hidden group">
                        {/* Shifting Liquid Highlight */}
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                        <div className="relative z-20 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                            <div className="space-y-4">
                                <h3 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase leading-[0.8]">Still not sure?</h3>
                                <p className="text-zinc-400 text-base md:text-lg font-bold max-w-xl leading-relaxed tracking-tight">Our experts can help you setup the perfect workflow for your specific shop model.</p>
                            </div>
                            <Link href="/auth/sign-up" className="px-10 py-5 rounded-2xl bg-white text-zinc-950 font-black uppercase tracking-widest text-[11px] hover:bg-emerald-400 transition-all duration-500 shadow-2xl hover:scale-105 active:scale-95 shrink-0">
                                START FREE DEMO
                            </Link>
                        </div>
                    </div>
                </AdvancedScrollReveal>
            </div>
        </section>
    )
}

function SolutionCard({ className, icon: Icon, title, tagline, description, color, dataPoints }: { className: string, icon: any, title: string, tagline: string, description: string, color: "emerald" | "blue" | "amber" | "indigo", dataPoints?: string[] }) {
    const colorStyles = {
        emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/10 group-hover:bg-emerald-500/20",
        blue: "bg-blue-500/10 text-blue-400 border-blue-500/10 group-hover:bg-blue-500/20",
        amber: "bg-amber-500/10 text-amber-400 border-amber-500/10 group-hover:bg-amber-500/20",
        indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/10 group-hover:bg-indigo-500/20"
    }

    return (
        <div className={cn(
            "group rounded-[2rem] bg-zinc-900 border border-white/5 p-6 flex flex-col justify-between transition-all duration-500 relative overflow-hidden",
            "hover:border-white/20 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] hover:-translate-y-1 hover:bg-zinc-900/80",
            className
        )}>
            {/* Dynamic Hover Glow */}
            <div className={cn(
                "absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] -mr-32 -mt-32 opacity-0 group-hover:opacity-20 transition-all duration-1000",
                color === "emerald" ? "bg-emerald-500" : color === "blue" ? "bg-blue-500" : color === "amber" ? "bg-amber-500" : "bg-indigo-500"
            )} />

            <div className="flex justify-between items-start relative z-10">
                <div className="space-y-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6", colorStyles[color])}>
                        <Icon size={20} className="transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black italic tracking-tighter leading-none mb-1 uppercase group-hover:text-white transition-colors">{title}</h3>
                        <p className={cn("text-[8px] font-black uppercase tracking-widest", color === "emerald" ? "text-emerald-500" : color === "blue" ? "text-blue-500" : color === "amber" ? "text-amber-500" : "text-indigo-500")}>{tagline}</p>
                    </div>
                </div>

                {dataPoints && (
                    <div className="flex flex-col gap-1 items-end">
                        {dataPoints.map((pt, i) => (
                            <div key={i} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[7px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-zinc-400 group-hover:border-white/10 transition-colors">
                                {pt}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="space-y-4 relative z-10">
                <p className="text-zinc-500 text-xs font-medium leading-relaxed max-w-sm group-hover:text-zinc-400 transition-colors">{description}</p>
                <div className="flex items-center gap-2 text-white font-black text-[9px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 duration-500">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">Explore solution</span>
                    <ArrowRight size={12} className={cn("transition-transform duration-500 group-hover:translate-x-1", color === "emerald" ? "text-emerald-400" : color === "blue" ? "text-blue-400" : color === "amber" ? "text-amber-400" : "text-indigo-400")} />
                </div>
            </div>
        </div>
    )
}
