"use client"

import { motion, useReducedMotion } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"
import { GradientText } from "@/components/gradient-text"
import { useDemoDashboardUrl } from "@/hooks/use-demo-dashboard-url"
import { useMainAuthUrls } from "@/hooks/use-main-auth-urls"
import { useMotion } from "@/components/motion-provider"

export function SolutionsCTA() {
    const reduceMotion = useReducedMotion()
    const { enableMotion } = useMotion()
    const shouldAnimate = enableMotion && !reduceMotion
    const demoDashboardUrl = useDemoDashboardUrl()
    const { signUpUrl } = useMainAuthUrls()

    return (
        <section className="relative py-40 overflow-hidden bg-white">
            {/* Bright Portal Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[150vw] h-[100vw] bg-gradient-to-t from-blue-500/15 via-emerald-500/10 to-transparent blur-[120px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
                <motion.div
                    initial={shouldAnimate ? { opacity: 0, scale: 0.9 } : { opacity: 1, scale: 1 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={shouldAnimate ? { duration: 0.8 } : { duration: 0 }}
                    viewport={{ once: true }}
                    className="space-y-12"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-[10px] font-bold uppercase tracking-[0.25em] text-blue-600 mb-8">
                        <Sparkles size={14} />
                        The Future of Indian Commerce
                    </div>

                    <h2 className="text-6xl md:text-8xl font-black tracking-tighter text-black leading-[0.95]">
                        Ready to <br />
                        <GradientText className="inline" colors={["#3b82f6", "#10b981", "#f59e0b"]}>
                            transform?
                        </GradientText>
                    </h2>

                    <p className="max-w-xl mx-auto text-zinc-600 text-xl font-medium leading-relaxed">
                        Join thousands of forward-thinking merchants who are scaling their business with the power of KhataPlus.
                    </p>

                    <div className="pt-10 flex flex-col md:flex-row items-center justify-center gap-6">
                        <Link
                            href={signUpUrl}
                            className="group relative px-10 py-5 bg-black text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-black/20"
                        >
                            <span className="relative z-10 flex items-center gap-3">
                                Get Started Free
                                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1 text-emerald-400" />
                            </span>
                        </Link>

                        <Link
                            href={demoDashboardUrl}
                            className="px-10 py-5 bg-white text-black border-2 border-zinc-200 font-black uppercase tracking-widest text-xs rounded-2xl transition-all hover:border-black active:scale-95"
                        >
                            Explore Demo
                        </Link>
                    </div>

                    <div className="pt-24 flex items-center justify-center gap-12 grayscale opacity-40">
                        <div className="h-6 w-24 bg-zinc-200 rounded-md animate-pulse" />
                        <div className="h-6 w-32 bg-zinc-200 rounded-md animate-pulse delay-75" />
                        <div className="h-6 w-20 bg-zinc-200 rounded-md animate-pulse delay-150" />
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
