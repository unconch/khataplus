"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useLocale } from "@/components/locale-provider"
import { Navbar } from "./Navbar"

interface HeroSectionProps {
    isAuthenticated: boolean
    orgSlug?: string | null
    isGuest?: boolean
}

export function HeroSection({ isAuthenticated, orgSlug, isGuest }: HeroSectionProps) {
    const { dictionary } = useLocale()
    const signUpUrl = "/auth/sign-up"
    const demoDashboardUrl = "/demo"
    const primaryHref = isAuthenticated ? (orgSlug ? `/${orgSlug}/dashboard` : "/dashboard") : signUpUrl

    return (
        <>
            <Navbar isAuthenticated={isAuthenticated} orgSlug={orgSlug} isGuest={isGuest} />

            <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#c9efdd_0%,#deefff_42%,#d3e7fb_100%)]">
                {/* Optimized CSS Animation Background */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 md:hidden bg-gradient-to-br from-emerald-300 via-white to-sky-300" />
                    <div className="hidden md:block absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/42 rounded-full blur-[130px] animate-float-slow will-change-transform" />
                    <div className="hidden md:block absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-sky-500/34 rounded-full blur-[150px] animate-float-slower will-change-transform" />
                    <div className="hidden md:block absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-violet-400/24 rounded-full blur-[120px] animate-float-medium will-change-transform" />
                    <div className="hidden md:block absolute left-[18%] bottom-[12%] w-[30%] h-[30%] bg-amber-400/18 rounded-full blur-[110px]" />

                    <div className="absolute inset-0 bg-white/12" />
                    <div className="hidden md:block absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `url("https://grainy-gradients.vercel.app/noise.svg")` }} />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 text-center">
                    <div className="mx-auto max-w-5xl px-6 py-10 md:px-10 md:py-12">
                        <h1 className="text-6xl sm:text-7xl md:text-9xl font-black text-zinc-950 tracking-tighter mb-8 leading-[0.9]">
                            Khata<span className="text-emerald-600">Plus.</span>
                        </h1>

                        <p className="text-zinc-600 text-lg md:text-2xl max-w-2xl mx-auto mb-16 font-medium leading-relaxed tracking-tight">
                            {dictionary.hero.tagline}
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
                            <Link href={primaryHref} className="w-full sm:w-auto mt-4 px-4">
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-300 to-cyan-300 rounded-full blur opacity-40 group-hover:opacity-80 transition duration-1000 group-hover:duration-200" />
                                    <button className="relative w-full sm:w-auto h-18 px-12 bg-zinc-950 text-white rounded-full text-xl font-black shadow-[0_18px_35px_-22px_rgba(15,23,42,0.45)] flex items-center justify-center gap-3 uppercase tracking-tighter hover:scale-[1.02] transition-all active:scale-95">
                                        {isAuthenticated ? dictionary.hero.goToDashboard : dictionary.hero.signUp}
                                        <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </Link>

                            <Link href={demoDashboardUrl} className="w-full sm:w-auto mt-4 px-4">
                                <button className="w-full sm:w-auto h-18 px-10 bg-white/88 backdrop-blur-md text-zinc-950 text-xl border border-white/80 hover:bg-white rounded-full transition-all font-black uppercase tracking-tighter hover:border-zinc-200 shadow-[0_18px_35px_-24px_rgba(15,23,42,0.22)]">
                                    {dictionary.hero.instantDemo}
                                </button>
                            </Link>
                        </div>
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
