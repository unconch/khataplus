"use client"

import Link from "next/link"
import { ArrowRight, CheckCircle2, Play, Sparkles, TrendingUp, DollarSign, Users, Package } from "lucide-react"
import { Navbar } from "./Navbar"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"
import { cn } from "@/lib/utils"

interface HeroSectionProps {
    isAuthenticated: boolean
    orgSlug?: string | null
    isGuest?: boolean
}

export function HeroSection({ isAuthenticated }: HeroSectionProps) {
    const primaryHref = isAuthenticated ? "/dashboard" : "/auth/sign-up"
    const secondaryHref = "/auth/login"

    return (
        <>
            <Navbar isAuthenticated={isAuthenticated} />

            <section className="relative min-h-[85svh] md:min-h-[750px] flex items-center overflow-hidden bg-[#0f4ad3] text-white">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_35%,#67dcff_0%,rgba(103,220,255,0.2)_26%,transparent_56%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_86%_18%,rgba(157,234,255,0.95)_0%,rgba(24,118,255,0.3)_30%,transparent_65%)]" />
                    <div className="absolute inset-0 bg-[linear-gradient(102deg,#0b2b92_0%,#1b65f1_48%,#66d4ff_100%)] opacity-85" />
                    <div className="absolute inset-0 opacity-[0.1] [background-image:radial-gradient(#ffffff_2px,transparent_2px)] [background-size:24px_24px]" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pt-12 pb-8">
                    <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                        <div className="space-y-6">

                            <AdvancedScrollReveal variant="slideUp" delay={220}>
                                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.95] uppercase italic">
                                    GST Billing & <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-100 via-white to-blue-300">Advance Khata.</span>
                                </h1>
                            </AdvancedScrollReveal>

                            <AdvancedScrollReveal variant="slideUp" delay={340}>
                                <p className="max-w-xl text-lg md:text-xl font-medium leading-relaxed text-blue-100/70 border-l-2 border-white/20 pl-6">
                                    Manage your business efficiently with professional GST billing, automated stock tracking, and digital credit records.
                                </p>
                            </AdvancedScrollReveal>

                            <AdvancedScrollReveal variant="slideUp" delay={430}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                                    {[
                                        "GST & Non-GST Billing",
                                        "Automated Credit Reminders",
                                        "Offline Billing Mode",
                                        "Daily Profit Reports",
                                    ].map((item) => (
                                        <div key={item} className="flex items-center gap-3 text-xs font-black text-blue-50/80 uppercase tracking-widest group">
                                            <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)] transition-all group-hover:scale-150" />
                                            <span className="group-hover:text-white transition-colors">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </AdvancedScrollReveal>

                            <AdvancedScrollReveal variant="slideUp" delay={560}>
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center pt-6">
                                    <Link
                                        href={primaryHref}
                                        className="inline-flex items-center justify-center gap-4 rounded-2xl bg-white px-14 py-6 text-[13px] font-black uppercase tracking-widest text-blue-700 shadow-2xl transition hover:bg-cyan-50 hover:scale-[1.03] active:scale-[0.98] relative overflow-hidden group/btn"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                                        <span className="relative z-10">Get Started Free</span>
                                        <ArrowRight className="h-5 w-5 relative z-10" />
                                    </Link>
                                    <Link
                                        href={secondaryHref}
                                        className="inline-flex items-center justify-center gap-4 rounded-2xl border border-white/30 bg-white/5 px-14 py-6 text-[13px] font-black uppercase tracking-widest text-white backdrop-blur-xl transition hover:bg-white/10 hover:border-white/50"
                                    >
                                        <Play className="h-5 w-5 fill-white stroke-0" />
                                        Login to Dashboard
                                    </Link>
                                </div>
                            </AdvancedScrollReveal>
                        </div>

                        <AdvancedScrollReveal variant="slideLeft" delay={280} className="relative hidden lg:block">
                            <div className="visual-stack">
                                {/* Dashboard Mockup */}
                                <div className="dash-frame">
                                    <div className="dash-sidebar">
                                        <div className="dash-logo">K</div>
                                        {[1, 2, 3, 4, 5].map(idx => (
                                            <div key={idx} className={cn("dash-nav", idx === 1 && "active")} />
                                        ))}
                                    </div>
                                    <div className="dash-main">
                                        <div className="flex justify-between items-center mb-6">
                                            <div className="space-y-1">
                                                <div className="h-2 w-20 bg-white/10 rounded-full" />
                                                <div className="h-4 w-32 bg-white/20 rounded-full" />
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="h-6 w-16 bg-white/5 border border-white/10 rounded-lg" />
                                                <div className="h-6 w-6 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3 mb-6">
                                            {[
                                                { label: "Sales Today", val: "₹1.4L", icon: TrendingUp, color: "text-emerald-400" },
                                                { label: "Items in Stock", val: "842", icon: Package, color: "text-blue-400" },
                                                { label: "Pending Credit", val: "₹12k", icon: DollarSign, color: "text-rose-400" }
                                            ].map((stat, i) => (
                                                <div key={i} className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                                                    <stat.icon size={12} className={stat.color} />
                                                    <div>
                                                        <div className="text-[7px] font-bold text-zinc-500 uppercase">{stat.label}</div>
                                                        <div className="text-xs font-black italic">{stat.val}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="bg-black/30 rounded-2xl border border-white/5 p-4 flex-1">
                                            <div className="flex justify-between items-end h-20 gap-1">
                                                {[40, 70, 45, 90, 65, 80, 55, 95, 40, 60, 85].map((h, i) => (
                                                    <div key={i} className="flex-1 bg-gradient-to-t from-blue-600/40 to-cyan-400/20 rounded-t-sm" style={{ height: `${h}%` }} />
                                                ))}
                                            </div>
                                            <div className="mt-4 flex justify-between">
                                                <div className="h-2 w-24 bg-white/5 rounded-full" />
                                                <div className="h-2 w-10 bg-white/10 rounded-full" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Phone - High Resolution Details */}
                                <div className="phone-card">
                                    <div className="phone-glow" />
                                    <div className="phone-shell">
                                        <div className="phone-notch" />
                                        <div className="phone-header">
                                            <div className="phone-avatar">K</div>
                                            <div className="space-y-1">
                                                <div className="h-1.5 w-12 bg-white/20 rounded-full" />
                                                <div className="h-1 w-8 bg-white/10 rounded-full" />
                                            </div>
                                        </div>

                                        <div className="p-4 space-y-4">
                                            <div className="h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
                                                <div className="flex justify-between">
                                                    <div className="h-1.5 w-8 bg-white/30 rounded" />
                                                    <div className="h-1.5 w-4 bg-white/30 rounded" />
                                                </div>
                                                <div>
                                                    <div className="text-[6px] font-black uppercase text-white/50 tracking-widest">Balance</div>
                                                    <div className="text-sm font-black italic text-white leading-none">₹82,410.00</div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                {[1, 2, 3, 4].map(i => (
                                                    <div key={i} className="h-12 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="space-y-2">
                                                {[1, 2].map(i => (
                                                    <div key={i} className="flex justify-between items-center bg-black/20 p-2 rounded-lg border border-white/5">
                                                        <div className="flex gap-2 items-center">
                                                            <div className="w-4 h-4 bg-white/5 rounded" />
                                                            <div className="h-1 w-12 bg-white/10 rounded-full" />
                                                        </div>
                                                        <div className="h-1 w-6 bg-emerald-500/40 rounded-full" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </AdvancedScrollReveal>
                    </div>
                </div>

                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/90 to-transparent" />

                <style jsx global>{`
                    .visual-stack {
                        position: relative;
                        width: 550px;
                        height: 420px;
                        margin-inline: auto;
                        perspective: 1500px;
                        transition: transform 0.8s ease-out;
                    }
                    .visual-stack:hover {
                        transform: translateY(-5px);
                    }
                    .dash-frame {
                        width: 100%;
                        height: 350px;
                        background: #080b18;
                        border-radius: 24px;
                        border: 1px solid rgba(255,255,255,0.08);
                        display: grid;
                        grid-template-columns: 80px 1fr;
                        transform: rotateY(-12deg) rotateX(5deg);
                        box-shadow: 
                            -15px 30px 60px -15px rgba(0,0,0,0.6);
                        transition: all 0.8s ease-out;
                        overflow: hidden;
                    }
                    .visual-stack:hover .dash-frame {
                        transform: rotateY(-8deg) rotateX(3deg);
                        box-shadow: 
                            -20px 40px 80px -20px rgba(0,0,0,0.7);
                    }
                    .dash-sidebar {
                        padding: 20px 12px;
                        border-right: 1px solid rgba(255,255,255,0.05);
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                        align-items: center;
                        background: #030610;
                    }
                    .dash-logo {
                        width: 32px;
                        height: 32px;
                        border-radius: 10px;
                        background: #3b82f6;
                        display: grid;
                        place-items: center;
                        font-weight: 900;
                        font-size: 14px;
                        color: white;
                        margin-bottom: 20px;
                        box-shadow: 0 0 15px rgba(59,130,246,0.3);
                    }
                    .dash-nav {
                        width: 24px;
                        height: 24px;
                        border-radius: 6px;
                        background: rgba(255,255,255,0.03);
                    }
                    .dash-nav.active {
                        background: rgba(255,255,255,0.1);
                        border: 1px solid rgba(255,255,255,0.1);
                    }
                    .dash-main {
                        padding: 30px;
                        background: linear-gradient(135deg, #080b18 0%, #030610 100%);
                        display: flex;
                        flex-direction: column;
                    }
                    .phone-card {
                        position: absolute;
                        right: -25px;
                        bottom: -15px;
                        width: 190px;
                        height: 360px;
                        transform: rotateY(-8deg) rotateZ(6deg) translateZ(50px);
                        animation: float 6s ease-in-out infinite;
                        transition: all 0.8s ease-out;
                    }
                    .visual-stack:hover .phone-card {
                        transform: rotateY(-3deg) rotateZ(3deg) translateZ(80px);
                        right: -35px;
                    }
                    .phone-shell {
                        width: 100%;
                        height: 100%;
                        background: #000;
                        border-radius: 32px;
                        border: 4px solid #1e293b;
                        box-shadow: 0 40px 80px -15px rgba(0,0,0,0.85);
                        position: relative;
                        overflow: hidden;
                        display: flex;
                        flex-direction: column;
                        ring: 1px solid rgba(255,255,255,0.1);
                    }
                    .phone-notch {
                        width: 60px;
                        height: 18px;
                        background: #1e293b;
                        position: absolute;
                        top: 0;
                        left: 50%;
                        transform: translateX(-50%);
                        border-bottom-left-radius: 12px;
                        border-bottom-right-radius: 12px;
                        z-index: 20;
                    }
                    .phone-header {
                        padding: 24px 16px 12px;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        border-bottom: 1px solid rgba(255,255,255,0.05);
                    }
                    .phone-avatar {
                        width: 24px;
                        height: 24px;
                        border-radius: 8px;
                        background: #22c55e;
                        display: grid;
                        place-items: center;
                        font-weight: 900;
                        font-size: 10px;
                        color: black;
                    }
                    .phone-glow {
                        position: absolute;
                        inset: -30px;
                        background: radial-gradient(circle, rgba(16,185,129,0.3), transparent 70%);
                        filter: blur(30px);
                    }
                    @keyframes float {
                        0%, 100% { transform: rotateY(-8deg) rotateZ(6deg) translateZ(50px) translateY(0); }
                        50% { transform: rotateY(-8deg) rotateZ(6deg) translateZ(50px) translateY(-12px); }
                    }
                    .visual-stack:hover .phone-card {
                        animation: float-hover 6s ease-in-out infinite;
                    }
                    @keyframes float-hover {
                        0%, 100% { transform: rotateY(-3deg) rotateZ(3deg) translateZ(80px) translateY(8px); }
                        50% { transform: rotateY(-3deg) rotateZ(3deg) translateZ(80px) translateY(-2px); }
                    }
                `}</style>
            </section>
        </>
    )
}
