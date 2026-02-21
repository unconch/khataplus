"use client"

import { ShieldCheck, Zap, Shield, Lock, EyeOff, Server } from "lucide-react"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { cn } from "@/lib/utils"

export function SecuritySection() {
    return (
        <section id="security" className="py-24 md:py-40 px-6 bg-white overflow-hidden relative">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row items-center gap-20">
                    <div className="w-full lg:w-1/2 space-y-12">
                        <AdvancedScrollReveal variant="slideRight">
                            <div className="space-y-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] border border-blue-100 shadow-sm">
                                    <ShieldCheck size={14} />
                                    Bank-Grade Protection
                                </div>
                                <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-zinc-900 leading-[0.95]">
                                    Your data. <br />
                                    <GradientText className="inline" colors={["#1d4ed8", "#3b82f6", "#60a5fa"]}>
                                        Always yours.
                                    </GradientText>
                                </h2>
                                <p className="text-zinc-500 text-xl font-medium leading-relaxed max-w-xl">
                                    We treat your business records with the same level of security as a financial institution. Compliant with DPDPA 2023, your data is encrypted at rest and in transit.
                                </p>
                            </div>
                        </AdvancedScrollReveal>

                        <div className="space-y-8">
                            <SecurityFeature
                                icon={Lock}
                                title="AES-256 Encryption"
                                desc="Every byte of your data is mathematically locked with industry-standard encryption protocols."
                            />
                            <SecurityFeature
                                icon={EyeOff}
                                title="Privacy by Design"
                                desc="We cannot see your data. Our Zero-Knowledge architecture ensures only you hold the keys."
                            />
                            <SecurityFeature
                                icon={Server}
                                title="Geo-Fenced Servers"
                                desc="Your data never leaves Indian borders, stored in high-tier domestic data centers."
                            />
                        </div>
                    </div>

                    <div className="w-full lg:w-1/2 relative">
                        <AdvancedScrollReveal variant="scaleUp">
                            <div className="relative">
                                {/* Large Glow Accent */}
                                <div className="absolute -inset-20 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

                                <div className="relative bg-zinc-950 rounded-[3.5rem] p-12 overflow-hidden shadow-2xl group border border-white/5">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -mr-32 -mt-32" />

                                    <div className="relative z-10 flex flex-col items-center text-center space-y-8">
                                        <div className="w-32 h-32 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center relative group-hover:scale-110 transition-transform duration-700">
                                            <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" />
                                            <ShieldCheck size={56} className="text-blue-400 relative z-10" />
                                        </div>

                                        <div className="space-y-2">
                                            <div className="text-white font-black text-3xl italic tracking-tighter">DPDPA 2023 Compliant</div>
                                            <p className="text-zinc-500 text-sm max-w-xs mx-auto">Verified Enterprise-Grade Infrastructure for Modern Indian Commerce.</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 w-full">
                                            <div className="bg-white/5 p-4 rounded-3xl border border-white/5 space-y-1">
                                                <div className="text-blue-400 font-black text-sm">99.9%</div>
                                                <div className="text-zinc-600 text-[9px] font-bold uppercase tracking-widest">Safety Score</div>
                                            </div>
                                            <div className="bg-white/5 p-4 rounded-3xl border border-white/5 space-y-1">
                                                <div className="text-emerald-400 font-black text-sm">Active</div>
                                                <div className="text-zinc-600 text-[9px] font-bold uppercase tracking-widest">Threat Monitor</div>
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-white/10 w-full flex justify-center gap-6">
                                            <div className="h-6 w-16 bg-white/10 rounded-md animate-pulse" />
                                            <div className="h-6 w-16 bg-white/10 rounded-md animate-pulse delay-150" />
                                            <div className="h-6 w-16 bg-white/10 rounded-md animate-pulse delay-300" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </AdvancedScrollReveal>
                    </div>
                </div>
            </div>
        </section>
    )
}

function SecurityFeature({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
    return (
        <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 flex-shrink-0">
                <Icon size={18} />
            </div>
            <div className="space-y-1">
                <h4 className="text-lg font-black italic tracking-tighter text-zinc-900 leading-none">{title}</h4>
                <p className="text-zinc-500 text-sm font-medium leading-relaxed max-w-md">{desc}</p>
            </div>
        </div>
    )
}
