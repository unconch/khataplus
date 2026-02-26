"use client"

import Link from "next/link"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { ArrowRight, UserPlus, PackagePlus, Rocket, Sparkles, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function HowItWorksSection() {
    return (
        <section id="how" className="py-12 md:py-20 px-6 bg-white relative overflow-hidden">
            {/* Architectural Background */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.02]">
                <div className="absolute inset-0 bg-[radial-gradient(#000_1px,transparent_1px)] bg-[length:32px_32px]" />
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
                <div className="flex flex-col md:flex-row items-end justify-between mb-12 md:mb-16 gap-8">
                    <AdvancedScrollReveal variant="slideUp">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950 text-white">
                                <Sparkles size={12} className="text-emerald-400" />
                                <span className="font-black text-[9px] tracking-widest uppercase text-white/90">3 Simple Steps</span>
                            </div>

                            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-zinc-900 leading-none uppercase italic">
                                Get Started <br />
                                <GradientText className="inline" colors={["#10b981", "#3b82f6", "#000000"]}>
                                    Today.
                                </GradientText>
                            </h2>
                        </div>
                    </AdvancedScrollReveal>

                    <div className="max-w-sm space-y-3 hidden md:block">
                        <p className="text-zinc-500 text-base font-medium leading-relaxed">
                            Replace paper registers with KhataPlus. Professional billing in minutes.
                        </p>
                        <div className="flex items-center gap-3 text-emerald-600 font-black text-[9px] uppercase tracking-widest">
                            <CheckCircle2 size={14} />
                            Free Trial • 5 min Setup
                        </div>
                    </div>
                </div>

                {/* Visual Step Timeline */}
                <div className="relative">
                    {/* Progress Track (Desktop) */}
                    <div className="hidden lg:block absolute top-[36px] left-0 right-0 h-px bg-zinc-100 z-0 overflow-hidden">
                        <div className="h-full bg-emerald-500 w-1/4 animate-[shimmer_3s_infinite]" />
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 relative z-10">
                        <Step
                            number="01"
                            icon={UserPlus}
                            title="Create Profile"
                            desc="Enter your business and GST details. Ready in seconds."
                            features={["GST Compliant", "Staff Profile"]}
                        />
                        <Step
                            number="02"
                            icon={PackagePlus}
                            title="Add Inventory"
                            desc="Import items via Excel or add manually with barcode support."
                            features={["Excel Import", "Barcode Ready"]}
                        />
                        <Step
                            number="03"
                            icon={Rocket}
                            title="Start Selling"
                            desc="Create invoices and track credit—anywhere, anytime."
                            features={["Offline Billing", "Mobile & PC"]}
                        />
                    </div>
                </div>

                <AdvancedScrollReveal variant="slideUp" delay={400}>
                    <div className="mt-20 p-8 md:p-12 rounded-[3rem] bg-zinc-950 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        <div className="relative z-10 flex flex-col gap-2">
                            <h3 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase leading-none text-white">Ready to Grow?</h3>
                            <div className="flex items-center justify-center md:justify-start gap-2 text-[8px] font-black uppercase tracking-widest text-zinc-500">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Live Sync Enabled
                            </div>
                        </div>
                        <div className="flex flex-col items-center md:items-end gap-3">
                            <Link href="/auth/sign-up" className="relative z-10 px-10 py-5 rounded-2xl bg-white text-zinc-950 font-black uppercase tracking-widest text-[10px] hover:bg-emerald-400 transition-all shadow-2xl hover:scale-105 active:scale-95">
                                Start Free Trial
                            </Link>
                            <Link href="/roadmap" className="relative z-10 text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors flex items-center gap-2 group/roadmap">
                                View Product Roadmap
                                <ArrowRight size={12} className="group-hover/roadmap:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </AdvancedScrollReveal>
            </div>
        </section>
    )
}

function Step({ number, icon: Icon, title, desc, features }: { number: string, icon: any, title: string, desc: string, features: string[] }) {
    return (
        <AdvancedScrollReveal variant="slideUp">
            <div className="group space-y-6">
                <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-900 shadow-sm group-hover:scale-110 group-hover:bg-zinc-950 group-hover:text-white transition-all duration-700">
                        <Icon size={24} />
                    </div>
                    <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-black italic tracking-tighter border-2 border-white shadow-lg">
                        {number}
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-xl font-black italic tracking-tighter text-zinc-900 leading-none group-hover:text-emerald-600 transition-colors uppercase">{title}</h3>
                    <p className="text-zinc-500 text-sm font-medium leading-relaxed">{desc}</p>

                    <ul className="space-y-1.5">
                        {features.map((f, i) => (
                            <li key={i} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-zinc-900 transition-colors">
                                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                {f}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </AdvancedScrollReveal>
    )
}
