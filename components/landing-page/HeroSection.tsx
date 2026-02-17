"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, Zap } from "lucide-react"
import { Navbar } from "./Navbar"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"

interface HeroSectionProps {
    isAuthenticated: boolean
    orgSlug?: string | null
    isGuest?: boolean
}

export function HeroSection({ isAuthenticated }: HeroSectionProps) {

    return (
        <>
            <Navbar isAuthenticated={isAuthenticated} />

            <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-zinc-950">
                {/* Optimized CSS Animation Background */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-emerald-600/30 rounded-full blur-[100px] animate-float-slow will-change-transform" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/30 rounded-full blur-[120px] animate-float-slower will-change-transform" />
                    <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-amber-500/20 rounded-full blur-[90px] animate-float-medium will-change-transform" />

                    <div className="absolute inset-0 bg-zinc-950/40" /> {/* Removed backdrop-blur for performance */}
                    <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay" style={{ backgroundImage: `url("https://grainy-gradients.vercel.app/noise.svg")` }} />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 text-center">

                    {/* Ultra-Modern Headline with Character Reveal */}
                    <AdvancedScrollReveal variant="slideUp" delay={200}>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-[10px] font-black tracking-widest uppercase mb-10 shadow-2xl backdrop-blur-xl">
                            <Zap size={10} className="fill-emerald-400" />
                            Smart Indian Business Platform
                        </div>
                    </AdvancedScrollReveal>

                    <AdvancedScrollReveal variant="slideUp" delay={400}>
                        <h1 className="text-6xl sm:text-7xl md:text-9xl font-black text-white tracking-tighter mb-8 leading-[0.9]">
                            Khata<span className="text-emerald-500">Plus.</span>
                        </h1>
                    </AdvancedScrollReveal>

                    <AdvancedScrollReveal variant="slideUp" delay={600}>
                        <p className="text-zinc-400 text-lg md:text-2xl max-w-2xl mx-auto mb-16 font-medium leading-relaxed tracking-tight">
                            Smart ledger management, <span className="text-zinc-100 font-bold">automated GST</span>, real-time inventory, and <span className="text-emerald-400/80">Credit Intelligence</span>.
                        </p>
                    </AdvancedScrollReveal>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
                        <AdvancedScrollReveal variant="slideUp" delay={1000}>
                            <Link href="/auth/sign-up" className="w-full sm:w-auto mt-4 px-4">
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse" />
                                    <button className="relative w-full sm:w-auto h-18 px-12 bg-white text-zinc-950 rounded-full text-xl font-black shadow-2xl flex items-center justify-center gap-3 uppercase tracking-tighter hover:scale-[1.02] transition-all active:scale-95">
                                        Sign Up
                                        <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </Link>
                        </AdvancedScrollReveal>

                        <AdvancedScrollReveal variant="slideUp" delay={1200}>
                            <Link href="/demo" className="w-full sm:w-auto mt-4 px-4">
                                <button className="w-full sm:w-auto h-18 px-10 bg-white/5 backdrop-blur-md text-white text-xl border border-white/20 hover:bg-white/10 rounded-full transition-all font-black uppercase tracking-tighter hover:border-white/40 shadow-xl">
                                    Instant Demo
                                </button>
                            </Link>
                        </AdvancedScrollReveal>
                    </div>


                </div>


                {/* Premium Curve Divider */}
                <div className="absolute bottom-0 left-0 right-0 h-32 z-10 pointer-events-none">
                    <svg viewBox="0 0 1440 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
                        <path d="M0 200L1440 200V0C1440 0 1080 120 720 120C360 120 0 0 0 0V200Z" fill="white" />
                    </svg>
                </div>

                <style jsx global>{`
                    @keyframes float-slow {
                        0%, 100% { transform: translate3d(0, 0, 0); }
                        50% { transform: translate3d(20px, -20px, 0); }
                    }
                    @keyframes float-slower {
                        0%, 100% { transform: translate3d(0, 0, 0); }
                        50% { transform: translate3d(-25px, 25px, 0); }
                    }
                     @keyframes float-medium {
                        0%, 100% { transform: translate3d(0, 0, 0); }
                        50% { transform: translate3d(15px, 15px, 0); }
                    }
                    .animate-float-slow { animation: float-slow 10s ease-in-out infinite; }
                    .animate-float-slower { animation: float-slower 12s ease-in-out infinite; }
                    .animate-float-medium { animation: float-medium 8s ease-in-out infinite; }
                    .will-change-transform { will-change: transform; }
                `}</style>
            </section>
        </>
    )
}
