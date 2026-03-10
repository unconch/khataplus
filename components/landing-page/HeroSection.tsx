import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Navbar } from "./Navbar"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"
import { useMainAuthUrls } from "@/hooks/use-main-auth-urls"
import { useDemoDashboardUrl } from "@/hooks/use-demo-dashboard-url"
import { useMotion } from "@/components/motion-provider"

interface HeroSectionProps {
    isAuthenticated: boolean
    orgSlug?: string | null
    isGuest?: boolean
}

export function HeroSection({ isAuthenticated, orgSlug, isGuest }: HeroSectionProps) {
    const { signUpUrl } = useMainAuthUrls()
    const demoDashboardUrl = useDemoDashboardUrl()
    const primaryHref = isAuthenticated ? (orgSlug ? `/${orgSlug}/dashboard` : "/dashboard") : signUpUrl
    const { enableMotion } = useMotion()
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768

    return (
        <>
            <Navbar isAuthenticated={isAuthenticated} orgSlug={orgSlug} isGuest={isGuest} />

            <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-zinc-950">
                {/* Optimized CSS Animation Background */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-emerald-600/30 rounded-full blur-[40px] ${enableMotion && !isMobile ? "animate-float-slow will-change-transform" : ""}`} />
                    <div className={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/30 rounded-full blur-[50px] ${enableMotion && !isMobile ? "animate-float-slower will-change-transform" : ""}`} />
                    <div className={`absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-amber-500/20 rounded-full blur-[30px] ${enableMotion && !isMobile ? "animate-float-medium will-change-transform" : ""}`} />

                    <div className="absolute inset-0 bg-zinc-950/40" />
                    {enableMotion ? (
                        <div
                            className="absolute inset-0 opacity-[0.15] mix-blend-overlay"
                            style={{ backgroundImage: `url("/noise.svg")` }}
                        />
                    ) : null}
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 text-center">

                    {/* Optimized Scroll Reveal Wrapper */}
                    <AdvancedScrollReveal variant="slideUp" delay={400}>
                        <>
                            <h1 className="text-6xl sm:text-7xl md:text-9xl font-black text-white tracking-tighter mb-8 leading-[0.9]">
                                Khata<span className="text-emerald-500">Plus.</span>
                            </h1>

                            <p className="text-zinc-400 text-lg md:text-2xl max-w-2xl mx-auto mb-16 font-medium leading-relaxed tracking-tight">
                                Smart ledger management, <span className="text-zinc-100 font-bold">automated GST</span>, real-time inventory, and <span className="text-emerald-400/80">Credit Intelligence</span>.
                            </p>
                        </>
                    </AdvancedScrollReveal>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
                        <AdvancedScrollReveal variant="slideUp" delay={600}>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                                <Link href={primaryHref} className="w-full sm:w-auto px-4">
                                    <div className="relative group">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse" />
                                        <button className="relative w-full sm:w-auto h-18 px-12 bg-white text-zinc-950 rounded-full text-xl font-black shadow-2xl flex items-center justify-center gap-3 uppercase tracking-tighter hover:scale-[1.02] transition-all active:scale-95">
                                            {isAuthenticated ? "Go to Dashboard" : "Sign Up"}
                                            <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </Link>

                                <Link href={demoDashboardUrl} className="w-full sm:w-auto px-4">
                                    <button className="w-full sm:w-auto h-18 px-10 bg-white/5 backdrop-blur-md text-white text-xl border border-white/20 hover:bg-white/10 rounded-full transition-all font-black uppercase tracking-tighter hover:border-white/40 shadow-xl">
                                        Instant Demo
                                    </button>
                                </Link>
                            </div>
                        </AdvancedScrollReveal>
                    </div>
                </div>

                {/* Premium Curve Divider */}
                <div className="absolute bottom-0 left-0 right-0 h-32 z-10 pointer-events-none">
                    <svg viewBox="0 0 1440 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="none">
                        <path d="M0 200L1440 200V0C1440 0 1080 120 720 120C360 120 0 0 0 0V200Z" fill="white" />
                    </svg>
                </div>

            </section>
        </>
    )
}
