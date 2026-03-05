"use client"

import { motion } from "framer-motion"
import { Shield, Zap, Eye } from "lucide-react"
import { GradientText } from "@/components/gradient-text"
import { cn } from "@/lib/utils"

const PILLARS = [
    {
        icon: Zap,
        title: "Adaptive Core",
        desc: "Logic that flexes with your scale. From one store to a thousand, our architecture stays lean and localized.",
        color: "text-blue-500",
        bg: "bg-blue-500/10"
    },
    {
        icon: Shield,
        title: "Sovereign Privacy",
        desc: "Zero-knowledge encryption ensures your business data belongs to you alone. We facilitate, you dominate.",
        color: "text-emerald-500",
        bg: "bg-emerald-500/10"
    },
    {
        icon: Eye,
        title: "Zero-Latency Insight",
        desc: "Real-time auditing and demand forecasting that works even when the internet doesn't. Intelligence without borders.",
        color: "text-orange-500",
        bg: "bg-orange-500/10"
    }
]

export function CorePhilosophy() {
    return (
        <section className="relative py-32 md:py-48 overflow-hidden bg-white">
            {/* Pulsing Central Visual - Clean black/gray lines for white theme */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl aspect-square pointer-events-none opacity-[0.03]">
                <motion.div
                    animate={{
                        scale: [1, 1.05, 1],
                        rotate: [0, 90, 180, 270, 360],
                    }}
                    transition={{
                        duration: 40,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    className="w-full h-full border-[1.5px] border-black rounded-[40%] blur-[2px]"
                />
                <motion.div
                    animate={{
                        scale: [1.05, 1, 1.05],
                        rotate: [360, 270, 180, 90, 0],
                    }}
                    transition={{
                        duration: 50,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    className="absolute inset-0 border-[1.5px] border-black rounded-[35%] blur-[2px]"
                />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-24 items-center">
                    <div className="space-y-12">
                        <div className="space-y-4">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8 }}
                                viewport={{ once: true }}
                                className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-600"
                            >
                                Unified Intelligence
                            </motion.div>
                            <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-black leading-[0.95]">
                                Our Core <br />
                                <GradientText className="inline" colors={["#3b82f6", "#10b981", "#f59e0b"]}>
                                    Philosophy.
                                </GradientText>
                            </h2>
                            <p className="max-w-md text-zinc-600 text-lg font-medium leading-relaxed">
                                Beyond features, we build systems that respect the autonomy and ingenuity of the Indian merchant.
                            </p>
                        </div>

                        <div className="space-y-8">
                            {PILLARS.map((pillar, i) => (
                                <motion.div
                                    key={pillar.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: i * 0.1 }}
                                    viewport={{ once: true }}
                                    className="flex gap-6 group"
                                >
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center border border-zinc-200 transition-all duration-500 group-hover:scale-110",
                                        pillar.bg, pillar.color,
                                        "group-hover:bg-white shadow-sm group-hover:shadow-lg"
                                    )}>
                                        <pillar.icon size={20} />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-xl font-bold italic tracking-tighter text-black leading-none">
                                            {pillar.title}
                                        </h4>
                                        <p className="text-zinc-600 text-sm font-medium leading-relaxed max-w-sm lowercase first-letter:uppercase">
                                            {pillar.desc}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="relative aspect-square">
                        {/* Large Abstract Icon representation - White Theme Optimized */}
                        <div className="absolute inset-0 bg-white rounded-[4rem] border border-zinc-200 shadow-2xl flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 opacity-15 pointer-events-none">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/30 blur-[100px]" />
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/30 blur-[100px]" />
                            </div>

                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
                                className="w-64 h-64 border border-dashed border-zinc-300 rounded-full flex items-center justify-center"
                            >
                                <div className="w-16 h-16 bg-white rounded-full shadow-xl flex items-center justify-center text-blue-600 border border-zinc-200">
                                    <Zap size={28} />
                                </div>
                            </motion.div>

                            {/* Orbiting Elements */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{
                                            rotate: 360,
                                        }}
                                        transition={{
                                            duration: 25 + i * 5,
                                            repeat: Infinity,
                                            ease: "linear",
                                        }}
                                        className="absolute w-80 h-80 pointer-events-none"
                                    >
                                        <div className={cn(
                                            "w-5 h-5 rounded-full absolute -top-2.5 left-1/2 -translate-x-1/2 blur-[2px]",
                                            i === 0 && "bg-blue-500/80",
                                            i === 1 && "bg-emerald-500/80",
                                            i === 2 && "bg-orange-500/80"
                                        )} />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
