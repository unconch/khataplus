"use client"

import Link from "next/link"
import {
    ArrowRight, Play, TrendingUp, DollarSign, Package,
    ShieldCheck, Zap, Globe, Sparkles, Smartphone, Monitor, RefreshCw, Layers
} from "lucide-react"
import { Navbar } from "./Navbar"
import { motion, Variants } from "framer-motion"
import { cn } from "@/lib/utils"
import { useDemoDashboardUrl } from "@/hooks/use-demo-dashboard-url"

interface HeroSectionProps {
    isAuthenticated: boolean
    orgSlug?: string | null
    isGuest?: boolean
}

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
}

const childVariants: Variants = {
    hidden: { opacity: 0, y: 32, rotateX: -30, filter: "blur(8px)" },
    visible: {
        opacity: 1,
        y: 0,
        rotateX: 0,
        filter: "blur(0px)",
        transition: { type: "spring", bounce: 0.3, duration: 0.8 } as any
    }
}

const fadeUpVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: 0.5 + (i * 0.12), duration: 0.8, ease: "easeOut" }
    })
}

export function HeroSection({ isAuthenticated, orgSlug, isGuest }: HeroSectionProps) {
    const primaryHref = isAuthenticated ? "/dashboard" : "/auth/sign-up"
    const demoDashboardUrl = useDemoDashboardUrl()

    return (
        <>
            <Navbar isAuthenticated={isAuthenticated} isLight orgSlug={orgSlug} isGuest={isGuest} />

            <section className="relative pt-24 md:pt-28 pb-28 md:pb-36 overflow-hidden bg-transparent text-zinc-900 selection:bg-emerald-100">
                {/* ULTIMATE SARVAM-STYLE RADIANCE (Cinematic Atmospheric Mesh) */}
                <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
                    style={{ maskImage: "linear-gradient(to bottom, black 80%, transparent)" }}
                >
                    {/* Primary Atmospheric Glow - Deep Emerald */}
                    <motion.div
                        animate={{
                            x: ["-10%", "5%", "-10%"],
                            y: ["-5%", "5%", "-5%"],
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, 0]
                        }}
                        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-[-35%] left-[-25%] w-[140vw] h-[140vw] bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.35)_0%,rgba(16,185,129,0.1)_40%,transparent_70%)] blur-[180px] rounded-full"
                    />

                    {/* Secondary Accented Glow - Royal Indigo */}
                    <motion.div
                        animate={{
                            x: ["8%", "-8%", "8%"],
                            y: ["5%", "-5%", "5%"],
                            scale: [1.1, 1, 1.1],
                            rotate: [0, -5, 0]
                        }}
                        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                        className="absolute top-[-30%] right-[-25%] w-[120vw] h-[120vw] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.25)_0%,rgba(99,102,241,0.05)_50%,transparent_70%)] blur-[200px] rounded-full"
                    />

                    {/* Tertiary Harmony Glow - Cyan/Teal (Ensures center isn't dead) */}
                    <motion.div
                        animate={{
                            scale: [0.8, 1.2, 0.8],
                            opacity: [0.3, 0.5, 0.3]
                        }}
                        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-[10%] left-[20%] w-[80vw] h-[60vw] bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.15)_0%,transparent_60%)] blur-[150px] rounded-full"
                    />

                    {/* Premium Detail - Softened Dot Grid Layer */}
                    <div className="absolute inset-0 opacity-[0.25] [background-image:radial-gradient(#cbd5e1_1.2px,transparent_1.2px)] [background-size:32px_32px]" />

                    {/* Noise Texture layer for high-end grain */}
                    <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }} />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 w-full text-center">

                    <div className="flex flex-col items-center mb-10 md:mb-12">
                        <motion.h1
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="mx-auto max-w-[14ch] text-[clamp(4rem,10vw,9.5rem)] font-black tracking-[-0.03em] leading-[1.05] perspective-1000"
                        >
                            <span className="block overflow-visible pb-2 relative z-10">
                                <motion.span variants={childVariants} className="inline-block">Billing</motion.span>
                            </span>
                            <span className="block overflow-visible py-2 relative z-20">
                                <motion.span
                                    variants={childVariants}
                                    className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 pb-4"
                                >
                                    Perfected
                                </motion.span>
                            </span>
                        </motion.h1>

                        <motion.p
                            custom={1}
                            variants={fadeUpVariants}
                            initial="hidden"
                            animate="visible"
                            className="max-w-4xl mx-auto mt-6 md:mt-8 text-[clamp(1.2rem,2vw,2.2rem)] font-light text-zinc-500 leading-relaxed tracking-tight"
                        >
                            Start on desktop, finish on mobile. <br className="hidden sm:block" />
                            <span className="text-zinc-900 font-medium">Smart billing for Indian business.</span>
                        </motion.p>
                    </div>

                    {/* Integrated Action Buttons */}
                    <motion.div
                        custom={2}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                        className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20 md:mb-24"
                    >
                        <Link
                            href={primaryHref}
                            className="relative group w-full sm:w-auto"
                        >
                            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500" />
                            <div className="relative inline-flex items-center justify-center gap-3 rounded-2xl bg-zinc-950 px-12 py-5 text-[13px] font-black uppercase tracking-[0.25em] text-white shadow-2xl transition-all hover:bg-zinc-900 hover:-translate-y-1 active:translate-y-0 overflow-hidden">
                                {/* Button Shine Effect */}
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />

                                <span className="relative z-10">Get Started Free</span>
                                <ArrowRight className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </div>
                        </Link>

                        <Link
                            href={demoDashboardUrl}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-2xl border border-zinc-200/50 bg-white/40 backdrop-blur-xl px-12 py-5 text-[13px] font-black uppercase tracking-[0.25em] text-zinc-800 transition-all hover:bg-white/80 hover:border-emerald-200/50 hover:shadow-2xl group hover:-translate-y-1 active:translate-y-0"
                        >
                            <div className="w-8 h-8 rounded-full bg-emerald-100/50 flex items-center justify-center transition-colors group-hover:bg-emerald-50">
                                <Play className="h-3 w-3 fill-emerald-600 stroke-emerald-600 transition-transform group-hover:scale-125" />
                            </div>
                            Live Demo
                        </Link>
                    </motion.div>

                    {/* Master Composition: The Adaptive Interface Visual */}
                    <div className="relative w-full max-w-6xl mx-auto min-h-[500px] flex items-center justify-center z-10">

                        {/* Desktop Window Shell (Base Layer) */}
                        <motion.div
                            initial={{ opacity: 0, y: 60, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 1.5, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="relative w-full max-w-5xl bg-white/40 backdrop-blur-3xl border border-zinc-200/50 rounded-[3rem] shadow-[0_40px_100px_-15px_rgba(0,0,0,0.1)] p-2 group"
                        >
                            <div className="absolute -inset-1 bg-gradient-to-br from-emerald-500/10 to-indigo-500/10 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition duration-1000 -z-10" />

                            <div className="bg-white rounded-[2.8rem] border border-zinc-100 overflow-hidden flex flex-col h-full min-h-[480px]">
                                {/* Browser Chrome */}
                                <div className="h-14 flex items-center justify-between px-8 border-b border-zinc-50 bg-zinc-50/30">
                                    <div className="flex gap-2.5">
                                        <div className="w-3 h-3 rounded-full bg-rose-400/80" />
                                        <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                                        <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                                    </div>
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em]">khata.plus / dashboard</div>
                                    <div className="w-10" />
                                </div>

                                {/* Dashboard Mockup Content */}
                                <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-12 text-left">
                                    <div className="hidden md:block space-y-8 pt-2">
                                        <div className="h-10 w-full bg-emerald-50 rounded-2xl border border-emerald-100/50" />
                                        <div className="space-y-4">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <div key={i} className="h-3 w-full bg-zinc-100 rounded-full" style={{ width: `${80 - (i * 5)}%` }} />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-10">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                            <MetricCard label="Total Sales" value="₹24.8L" color="text-emerald-600" />
                                            <MetricCard label="Receivables" value="₹3.2L" color="text-rose-600" />
                                            <MetricCard label="Stock Value" value="₹12.5L" color="text-indigo-600" />
                                        </div>
                                        <div className="h-48 rounded-3xl bg-zinc-50/50 border border-zinc-100 flex items-end p-6 gap-2 pt-16 relative overflow-hidden">
                                            <div className="absolute top-6 left-6 flex items-center gap-2">
                                                <div className="h-2 w-24 bg-zinc-200 rounded-full" />
                                                <TrendingUp size={14} className="text-emerald-500" />
                                            </div>
                                            {[40, 70, 45, 90, 65, 80, 55, 95, 40, 60, 85, 30, 75, 50, 90, 60, 40, 70, 50].map((h, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${h}%` }}
                                                    transition={{ delay: 1.5 + (i * 0.04), duration: 1, ease: "easeOut" }}
                                                    className="flex-1 bg-zinc-200 hover:bg-emerald-400 transition-colors duration-300 rounded-t-[2px]"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Mobile Device (Overlapping Layer) */}
                        <motion.div
                            initial={{ opacity: 0, x: 100, y: 50, rotate: 10 }}
                            animate={{ opacity: 1, x: 0, y: 20, rotate: -4 }}
                            transition={{ duration: 1.5, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute -right-4 md:-right-12 -bottom-20 w-[260px] h-[520px] bg-white border border-zinc-200 rounded-[3rem] shadow-[0_40px_80px_rgba(0,0,0,0.15),_0_0_0_8px_#fafafa] p-1.5 z-20 group/phone hidden lg:block"
                        >
                            <div className="h-full bg-white rounded-[2.8rem] overflow-hidden relative flex flex-col border border-zinc-100 shrink-0">
                                {/* Notch */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-zinc-100 rounded-b-2xl z-20" />

                                <div className="p-5 pt-12 flex-1 flex flex-col gap-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="space-y-2">
                                            <div className="h-2 w-20 bg-zinc-800 rounded-full" />
                                            <div className="h-3 w-12 bg-zinc-200 rounded-full" />
                                        </div>
                                        <div className="w-10 h-10 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-emerald-500">
                                            <RefreshCw size={18} className="animate-spin-slow" />
                                        </div>
                                    </div>

                                    {/* Integrated Phone List */}
                                    <div className="h-40 rounded-[2rem] bg-emerald-500 p-6 flex flex-col justify-between text-white relative overflow-hidden group/card shadow-lg shadow-emerald-500/20 mb-4">
                                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 blur-3xl rounded-full" />
                                        <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                                            <motion.div
                                                animate={{ x: ["-100%", "100%"] }}
                                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                                className="h-full w-1/3 bg-white/60"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">Synced Sales</div>
                                            <div className="text-3xl font-black tabular-nums">₹2,450</div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-16 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center px-4 gap-4 shadow-sm group/item">
                                                <div className="w-10 h-10 rounded-xl bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 group-hover/item:text-emerald-500 transition-colors">
                                                    <DollarSign size={18} strokeWidth={2.5} />
                                                </div>
                                                <div className="space-y-2 flex-1">
                                                    <div className="h-2 w-full bg-zinc-200 rounded-full" />
                                                    <div className="h-2 w-2/3 bg-zinc-100 rounded-full" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Phone Sync Badge */}
                                <div className="p-4 bg-zinc-50/50 border-t border-zinc-100 flex justify-center">
                                    <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                        <Smartphone size={10} /> Pocket Intelligence Ready
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Connection Visual (Sync Line) */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none -z-10 hidden lg:block">
                            <svg className="w-full h-full opacity-30" viewBox="0 0 1000 600" fill="none">
                                <motion.path
                                    d="M600 300 Q 800 300 900 450"
                                    stroke="url(#gradient-sync)"
                                    strokeWidth="2"
                                    strokeDasharray="8 8"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 2, delay: 2 }}
                                />
                                <defs>
                                    <linearGradient id="gradient-sync" x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stopColor="#10b981" />
                                        <stop offset="100%" stopColor="#6366f1" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>

                        {/* Floating Feature Pills (Merged) */}
                        <div className="absolute top-20 -left-12 hidden xl:block">
                            <HeroPill icon={ShieldCheck} text="Encrypted Ledger" color="text-indigo-600" />
                        </div>
                        <div className="absolute -top-16 right-48 hidden xl:block">
                            <HeroPill icon={Globe} text="Offline-First" color="text-emerald-600" />
                        </div>
                    </div>
                </div>

                <style jsx global>{`
                    .perspective-1000 { perspective: 1000px; }
                    .glass-panel {
                        box-shadow: 
                            0 0 0 1px rgba(255,255,255,0.4) inset,
                            0 40px 100px -15px rgba(0,0,0,0.1);
                    }
                    @keyframes spin-slow {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    .animate-spin-slow {
                        animation: spin-slow 6s linear infinite;
                    }
                `}</style>
            </section>
        </>
    )
}

function MetricCard({ label, value, color }: any) {
    return (
        <div className="bg-white/50 backdrop-blur-sm border border-zinc-100 p-6 rounded-3xl hover:shadow-lg transition-all duration-500">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2">{label}</div>
            <div className={cn("text-2xl font-black tracking-tight", color)}>{value}</div>
        </div>
    )
}

function HeroPill({ icon: Icon, text, color }: any) {
    return (
        <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="flex items-center gap-3 px-5 py-3 bg-white/80 rounded-2xl border border-zinc-200 shadow-xl backdrop-blur-xl"
        >
            <div className={cn("w-9 h-9 rounded-xl bg-zinc-50 flex items-center justify-center", color)}>
                <Icon size={18} />
            </div>
            <span className="text-[11px] font-black text-zinc-800 tracking-wider uppercase">{text}</span>
        </motion.div>
    )
}
