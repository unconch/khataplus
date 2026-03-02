"use client"

import { useState, useRef, useEffect } from "react"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { Smartphone, Monitor, Layout, Sparkles, Database, BarChart3, Users, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

const capabilities = [
    {
        id: "adaptive",
        icon: Smartphone,
        title: "Adaptive Architecture",
        description: "A single unified core that morphs perfectly for mobile field teams, desktop back-office, and high-speed POS terminals.",
        color: "blue",
        highlights: ["Native Mobile App", "Desktop Power", "POS Optimized"]
    },
    {
        id: "inventory",
        icon: Database,
        title: "Cognitive Inventory",
        description: "Zero-latency stock tracking that predicts demand, automates reordering, and manages multi-warehouse logistics in real-time.",
        color: "emerald",
        highlights: ["Demand Forecasting", "Auto-Stocking", "Multi-Location"]
    },
    {
        id: "khata",
        icon: Users,
        title: "Sovereign Khata",
        description: "Digital ledger with military-grade trust. Automate customer credit, payment reminders, and settlement via integrated UPI rails.",
        color: "amber",
        highlights: ["UPI Integration", "Automated Reminders", "Credit Scoring"]
    },
    {
        id: "insights",
        icon: BarChart3,
        title: "Frontier Analytics",
        description: "Move beyond static reports. Get population-scale insights into your business growth with automated AI auditing.",
        color: "purple",
        highlights: ["Executive Reports", "Trend Analysis", "Loss Detection"]
    }
]

export function CapabilitiesExplorer() {
    const containerRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    })

    const [activeIndex, setActiveIndex] = useState(0)

    // Map scroll progress to active index
    useEffect(() => {
        const unsubscribe = scrollYProgress.on("change", (v) => {
            const index = Math.min(
                Math.floor(v * capabilities.length),
                capabilities.length - 1
            )
            setActiveIndex(index)
        })
        return () => unsubscribe()
    }, [scrollYProgress])

    return (
        <section ref={containerRef} className="relative h-[400vh] bg-white">
            <div className="sticky top-0 h-screen w-full flex flex-col md:flex-row items-center overflow-hidden">

                {/* Background Text Accent */}
                <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center opacity-[0.02]">
                    <span className="text-[30vw] font-black uppercase tracking-tighter text-black select-none whitespace-nowrap">
                        {capabilities[activeIndex].id}
                    </span>
                </div>

                {/* Left Content Column */}
                <div className="relative z-10 w-full md:w-1/2 h-full flex flex-col justify-center px-8 md:px-24">
                    <div className="max-w-xl space-y-12">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeIndex}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                className="space-y-8"
                            >
                                <div className={cn(
                                    "w-16 h-16 rounded-2xl flex items-center justify-center border transition-colors duration-500",
                                    activeIndex === 0 && "bg-blue-500/10 border-blue-500/20 text-blue-500",
                                    activeIndex === 1 && "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
                                    activeIndex === 2 && "bg-amber-500/10 border-amber-500/20 text-amber-500",
                                    activeIndex === 3 && "bg-purple-500/10 border-purple-500/20 text-purple-500"
                                )}>
                                    {(() => {
                                        const Icon = capabilities[activeIndex].icon
                                        return <Icon size={32} />
                                    })()}
                                </div>

                                <div className="space-y-6">
                                    <h2 className="text-5xl md:text-7xl font-semibold tracking-[-0.03em] leading-none text-black">
                                        {capabilities[activeIndex].title}
                                    </h2>
                                    <p className="text-xl md:text-2xl text-zinc-500 font-normal leading-relaxed">
                                        {capabilities[activeIndex].description}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    {capabilities[activeIndex].highlights.map((h, i) => (
                                        <div key={i} className="px-4 py-2 rounded-xl bg-black/5 border border-black/10 text-xs font-bold uppercase tracking-widest text-zinc-500">
                                            {h}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Progress Indicators */}
                        <div className="flex items-center gap-4 pt-12">
                            {capabilities.map((_, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "h-1 transition-all duration-500 rounded-full",
                                        i === activeIndex ? "w-12 bg-white" : "w-4 bg-white/10"
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Visual Column */}
                <div className="relative z-10 w-full md:w-1/2 h-full flex items-center justify-center p-8 md:p-24 overflow-hidden">
                    <div className="relative w-full aspect-square max-w-[600px] flex items-center justify-center">

                        {/* Central Visual Anchor */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeIndex}
                                initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                exit={{ opacity: 0, scale: 1.2, rotate: 10 }}
                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                className="relative w-full h-full"
                            >
                                {/* Gradient Glow behind mockup */}
                                <div className={cn(
                                    "absolute inset-0 blur-[120px] opacity-20 transition-colors duration-1000",
                                    activeIndex === 0 && "bg-blue-500",
                                    activeIndex === 1 && "bg-emerald-500",
                                    activeIndex === 2 && "bg-amber-500",
                                    activeIndex === 3 && "bg-purple-500"
                                )} />

                                {/* High-Fidelity Mockup Container */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="relative w-[180%] h-[180%] md:w-full md:h-full bg-white/50 backdrop-blur-3xl border border-black/10 rounded-[4rem] shadow-3xl overflow-hidden p-8 md:p-14">
                                        <div className="w-full h-full rounded-[2.5rem] bg-white border border-black/5 shadow-2xl relative overflow-hidden">
                                            {/* Simulated UI Content based on ID */}
                                            {capabilities[activeIndex].id === "adaptive" && <AdaptiveUI />}
                                            {capabilities[activeIndex].id === "inventory" && <InventoryUI />}
                                            {capabilities[activeIndex].id === "khata" && <KhataUI />}
                                            {capabilities[activeIndex].id === "insights" && <InsightsUI />}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    )
}

function AdaptiveUI() {
    return (
        <div className="p-8 space-y-8 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div className="h-4 w-32 bg-black/10 rounded-full" />
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Monitor size={18} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="h-24 rounded-2xl bg-black/5 border border-black/5" />
                <div className="h-24 rounded-2xl bg-black/5 border border-black/5" />
            </div>
            <div className="flex-1 rounded-2xl bg-black/5 border border-black/5 flex items-center justify-center">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Unified Core Active</div>
            </div>
        </div>
    )
}

function InventoryUI() {
    return (
        <div className="p-8 space-y-8 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div className="h-4 w-40 bg-black/10 rounded-full" />
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <Database size={18} />
                </div>
            </div>
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-black/5">
                        <div className="w-10 h-10 rounded-lg bg-zinc-100" />
                        <div className="flex-1 space-y-2">
                            <div className="h-2 w-1/2 bg-black/10 rounded-full" />
                            <div className="h-1.5 w-1/4 bg-black/5 rounded-full" />
                        </div>
                        <div className="h-4 w-12 bg-emerald-500/10 rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    )
}

function KhataUI() {
    return (
        <div className="p-8 space-y-8 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div className="h-4 w-24 bg-black/10 rounded-full" />
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <Users size={18} />
                </div>
            </div>
            <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 space-y-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Pending Settlement</div>
                <div className="text-4xl font-semibold text-black tracking-tight">₹1,24,500.00</div>
            </div>
            <div className="flex-1 space-y-4">
                <div className="flex justify-between items-center px-4 py-2 border-b border-black/5">
                    <div className="text-sm text-zinc-500">Merchant UPI</div>
                    <div className="text-xs font-mono text-black">kp.merchant@axis</div>
                </div>
                <div className="h-12 rounded-2xl bg-black text-white font-bold text-xs flex items-center justify-center uppercase tracking-widest">
                    Request via WhatsApp
                </div>
            </div>
        </div>
    )
}

function InsightsUI() {
    return (
        <div className="p-8 space-y-8 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div className="h-4 w-36 bg-white/10 rounded-full" />
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-500">
                    <BarChart3 size={18} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 flex-1">
                <div className="rounded-2xl bg-white/5 border border-white/5 p-4 flex flex-col justify-end gap-2">
                    <div className="h-12 w-2 bg-purple-500 rounded-full" />
                    <div className="text-[8px] font-bold text-zinc-500 uppercase">Sales</div>
                </div>
                <div className="rounded-2xl bg-white/5 border border-white/5 p-4 flex flex-col justify-end gap-2">
                    <div className="h-16 w-2 bg-emerald-500 rounded-full" />
                    <div className="text-[8px] font-bold text-zinc-500 uppercase">Growth</div>
                </div>
            </div>
            <div className="h-20 rounded-2xl bg-purple-500/10 border border-purple-500/20 p-4">
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full w-[80%] bg-purple-500" />
                </div>
            </div>
        </div>
    )
}
