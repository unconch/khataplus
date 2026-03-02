"use client"

import { Monitor, Smartphone, Zap, Layers, RefreshCw, ArrowRight } from "lucide-react"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"
import { motion } from "framer-motion"

export function AdaptiveInterfaceSection() {
    return (
        <section id="interface" className="py-24 md:py-32 px-6 bg-transparent relative overflow-hidden text-zinc-900">
            {/* Massive Ambient Background Glows - Light Mode */}
            <div className="absolute top-1/4 -left-1/4 w-[800px] h-[800px] bg-indigo-300/30 blur-[150px] rounded-full pointer-events-none mix-blend-multiply" />
            <div className="absolute bottom-1/4 -right-1/4 w-[800px] h-[800px] bg-emerald-300/30 blur-[150px] rounded-full pointer-events-none mix-blend-multiply" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-24 mt-12 space-y-4">
                    <AdvancedScrollReveal variant="slideUp">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 border border-zinc-200/50 backdrop-blur-md mb-8 shadow-sm">
                            <Layers size={14} className="text-emerald-500" />
                            <span className="text-zinc-600 font-bold text-[11px] tracking-[0.2em] uppercase">Universal Access</span>
                        </div>
                        <h2 className="text-5xl md:text-7xl font-semibold tracking-tighter text-zinc-900 leading-[1.05] max-w-4xl mx-auto">
                            Available everywhere. <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500">Always in sync.</span>
                        </h2>
                        <p className="text-zinc-500 text-xl md:text-2xl max-w-3xl mx-auto mt-8 font-light tracking-wide">
                            Start billing on your computer, finish on your phone. <br className="hidden md:block" />Everything updates instantly, flowing with real-time intelligence.
                        </p>
                    </AdvancedScrollReveal>
                </div>

                {/* Abstract UI Mockup */}
                <AdvancedScrollReveal variant="scaleUp">
                    <div className="relative w-full max-w-5xl mx-auto min-h-[500px] flex items-center justify-center p-4 md:p-12 mb-32 z-20">

                        <div className="relative w-full h-full flex flex-col items-center justify-center">

                            {/* Main Desktop-ish Card (Light Mode) */}
                            <motion.div
                                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                                className="w-full max-w-4xl bg-white/40 backdrop-blur-3xl border border-zinc-200/50 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-2 relative overflow-hidden ring-1 ring-white"
                            >
                                {/* Inner Desktop Chrome */}
                                <div className="bg-white rounded-[2rem] border border-zinc-100 overflow-hidden h-full flex flex-col shadow-sm pb-8 relative">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100 blur-[80px] rounded-full pointer-events-none" />

                                    <div className="h-14 flex items-center px-6 shrink-0 border-b border-zinc-50 bg-zinc-50/50">
                                        <div className="flex gap-2">
                                            <div className="w-3 h-3 rounded-full bg-red-400" />
                                            <div className="w-3 h-3 rounded-full bg-amber-400" />
                                            <div className="w-3 h-3 rounded-full bg-emerald-400" />
                                        </div>
                                    </div>

                                    {/* Dashboard Content Area */}
                                    <div className="flex-1 px-6 md:px-10 flex gap-8 md:gap-14 bg-gradient-to-b from-white to-zinc-50/30">
                                        {/* Sidebar */}
                                        <div className="w-48 hidden md:flex flex-col gap-5 shrink-0 pt-8 border-r border-zinc-50 pr-8">
                                            <div className="h-8 w-28 bg-zinc-100 rounded-xl mb-4" />
                                            <div className="h-4 w-full bg-emerald-100 rounded-full" />
                                            <div className="h-3 w-3/4 bg-zinc-100 rounded-full" />
                                            <div className="h-3 w-5/6 bg-zinc-100 rounded-full" />
                                            <div className="h-3 w-2/3 bg-zinc-100 rounded-full mb-6" />

                                            <div className="h-3 w-3/4 bg-zinc-100 rounded-full" />
                                            <div className="h-3 w-1/2 bg-zinc-100 rounded-full" />
                                        </div>

                                        {/* Main Content Grid */}
                                        <div className="flex-1 flex flex-col gap-8 pt-8 relative z-10">
                                            <div className="h-8 w-56 bg-zinc-200 rounded-full" />

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <div className="h-40 rounded-2xl bg-white border border-zinc-100 p-6 space-y-4 shadow-sm flex flex-col justify-between group relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 blur-xl rounded-full" />
                                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 relative z-10">
                                                        <div className="w-6 h-6 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.3)]" />
                                                    </div>
                                                    <div className="space-y-3 pb-2 relative z-10">
                                                        <div className="h-3 w-24 bg-zinc-100 rounded-full" />
                                                    </div>
                                                    <div className="h-8 w-32 bg-zinc-200 rounded-full relative z-10" />
                                                </div>
                                                <div className="h-40 rounded-2xl bg-white border border-zinc-100 p-6 space-y-4 shadow-sm flex flex-col justify-between group relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 blur-xl rounded-full" />
                                                    <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center border border-orange-100 relative z-10">
                                                        <div className="w-6 h-6 bg-orange-400 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.3)]" />
                                                    </div>
                                                    <div className="space-y-3 pb-2 relative z-10">
                                                        <div className="h-3 w-24 bg-zinc-100 rounded-full" />
                                                    </div>
                                                    <div className="h-8 w-32 bg-zinc-200 rounded-full relative z-10" />
                                                </div>
                                            </div>

                                            <div className="flex-1 min-h-[160px] rounded-2xl bg-white border border-zinc-100 p-6 flex flex-col justify-end shadow-sm">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Floating Mobile-ish Card */}
                            <motion.div
                                initial={{ opacity: 0, x: 60, y: 30 }}
                                whileInView={{ opacity: 1, x: 0, y: 15 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                className="absolute -right-4 md:-right-8 -bottom-16 w-[280px] h-[580px] bg-white border border-zinc-200 rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.1),_0_0_0_8px_#f4f4f5] p-1 flex flex-col z-30 transform md:rotate-3 overflow-visible"
                            >
                                {/* Inner Phone Screen */}
                                <div className="flex-1 bg-[#fafafa] rounded-[2.8rem] overflow-hidden relative flex flex-col border border-zinc-100">
                                    {/* Notch */}
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-zinc-200 rounded-b-2xl z-30" />

                                    <div className="flex-1 relative flex flex-col gap-4 pt-16 px-4 z-10">
                                        <div className="space-y-2 px-2">
                                            <div className="h-2 w-16 bg-zinc-300 rounded-full" />
                                            <div className="h-4 w-24 bg-zinc-800 rounded-full" />
                                        </div>

                                        {/* Glow Card */}
                                        <div className="h-44 rounded-[1.5rem] bg-gradient-to-br from-emerald-500 to-teal-400 p-6 shadow-md flex flex-col justify-between relative overflow-hidden mt-2 border border-emerald-400">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 blur-2xl rounded-full" />
                                            <div className="h-8 w-3/4 bg-black/10 rounded-full p-1.5 flex items-center backdrop-blur-sm">
                                                <div className="h-full w-2/3 bg-white/90 rounded-full" />
                                            </div>
                                            <div className="flex items-end justify-between relative z-10">
                                                <div className="space-y-3">
                                                    <div className="h-3 w-20 bg-white/70 rounded-full" />
                                                    <div className="h-4 w-16 bg-white rounded-full" />
                                                </div>
                                                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-sm"><ArrowRight size={16} className="text-white" /></div>
                                            </div>
                                        </div>

                                        {/* List Items */}
                                        <div className="space-y-3 mt-4">
                                            <div className="h-16 border border-zinc-200 rounded-2xl bg-white shadow-sm flex items-center px-4 gap-4">
                                                <div className="w-8 h-8 rounded-full bg-zinc-100" />
                                                <div className="space-y-2 flex-1">
                                                    <div className="h-2 w-full bg-zinc-200 rounded-full" />
                                                    <div className="h-2 w-2/3 bg-zinc-100 rounded-full" />
                                                </div>
                                            </div>
                                            <div className="h-16 border border-zinc-200 rounded-2xl bg-white shadow-sm flex items-center px-4 gap-4">
                                                <div className="w-8 h-8 rounded-full bg-zinc-100" />
                                                <div className="space-y-2 flex-1">
                                                    <div className="h-2 w-full bg-zinc-200 rounded-full" />
                                                    <div className="h-2 w-1/2 bg-zinc-100 rounded-full" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sync Notification Pop */}
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                            whileInView={{ opacity: 1, scale: 1, y: 0 }}
                                            transition={{ duration: 0.5, delay: 1.8, type: "spring" }}
                                            className="absolute bottom-10 left-4 right-4 h-16 bg-white border border-emerald-100 rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.08),_0_0_15px_rgba(16,185,129,0.1)] flex items-center px-4 gap-4"
                                        >
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                                className="w-8 h-8 rounded-full border border-emerald-100 bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-sm"
                                            >
                                                <RefreshCw size={14} />
                                            </motion.div>
                                            <div className="space-y-2 flex-1">
                                                <div className="h-2 w-20 bg-zinc-800 rounded-full" />
                                                <div className="h-1.5 w-16 bg-zinc-300 rounded-full" />
                                            </div>
                                        </motion.div>
                                    </div>
                                    <div className="h-2 w-32 bg-zinc-200 rounded-full mx-auto mb-2 relative z-30" />
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </AdvancedScrollReveal>

                {/* Refined Footer Features */}
                <AdvancedScrollReveal variant="slideUp" delay={200}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto border-t border-zinc-100 pt-16 mt-16">
                        <FeatureItem icon={Monitor} title="Desktop Command" desc="Massive analytics on your primary screen." />
                        <FeatureItem icon={Smartphone} title="Mobile Access" desc="Pocket-ready power for on-the-go billing." />
                        <FeatureItem icon={Zap} title="Instant Relay" desc="Data propagates across your devices within milliseconds." />
                    </div>
                </AdvancedScrollReveal>
            </div>
        </section>
    )
}

function FeatureItem({ icon: Icon, title, desc }: any) {
    return (
        <div className="flex flex-col items-center text-center space-y-4 group">
            <div className="w-16 h-16 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-600 shadow-sm group-hover:scale-110 group-hover:bg-emerald-50 group-hover:border-emerald-100 group-hover:text-emerald-600 transition-all duration-500">
                <Icon size={24} strokeWidth={1.5} />
            </div>
            <div>
                <h4 className="font-semibold text-zinc-900 tracking-tight text-lg mb-2">{title}</h4>
                <p className="text-zinc-500 font-medium leading-relaxed">{desc}</p>
            </div>
        </div>
    )
}
