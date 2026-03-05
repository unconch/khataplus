"use client"

import { motion, useScroll, useTransform, useSpring } from "framer-motion"
import { useRef } from "react"
import { Store, Truck, Briefcase, HandCoins, ArrowRight, ShieldCheck, Stethoscope, Utensils, Cpu, Shirt } from "lucide-react"
import { cn } from "@/lib/utils"

const SOLUTIONS = [
    {
        id: "retail",
        icon: Store,
        title: "Retail & Kirana",
        tagline: "High-Volume Ready",
        description: "Process bills instantly with barcode support. Keep queues moving and automate stock management without breaking a sweat.",
        iconColor: "text-emerald-600",
        borderColor: "border-emerald-100",
        bgLight: "bg-emerald-50/50",
        accent: "bg-emerald-500"
    },
    {
        id: "wholesale",
        icon: Truck,
        title: "B2B Distribution",
        tagline: "Enterprise Control",
        description: "Track supplier payouts, manage B2B customer ledgers, and handle customized volume pricing with confidence.",
        iconColor: "text-blue-600",
        borderColor: "border-blue-100",
        bgLight: "bg-blue-50/50",
        accent: "bg-blue-500"
    },
    {
        id: "pharmacy",
        icon: Stethoscope,
        title: "Pharmacy & Medical",
        tagline: "Precision Tracking",
        description: "Manage batch numbers, expiry dates, and automated low-stock clinical alerts with unparalleled accuracy.",
        iconColor: "text-teal-600",
        borderColor: "border-teal-100",
        bgLight: "bg-teal-50/50",
        accent: "bg-teal-500"
    },
    {
        id: "apparel",
        icon: Shirt,
        title: "Apparel & Fashion",
        tagline: "Matrix Inventory",
        description: "Effortlessly handle variants like sizes, colors, and seasonal drops with intuitive visual inventory dashboards.",
        iconColor: "text-rose-600",
        borderColor: "border-rose-100",
        bgLight: "bg-rose-50/50",
        accent: "bg-rose-500"
    },
    {
        id: "restaurants",
        icon: Utensils,
        title: "Restaurants & Cafes",
        tagline: "Rapid Service",
        description: "Manage tables, digital menus, and kitchen order tickets (KOT) seamlessly during peak dining hours.",
        iconColor: "text-amber-600",
        borderColor: "border-amber-100",
        bgLight: "bg-amber-50/50",
        accent: "bg-amber-500"
    },
    {
        id: "electronics",
        icon: Cpu,
        title: "Electronics & Mobile",
        tagline: "Serial Management",
        description: "Track unique IMEI numbers, manage serial warranties, and handle high-value bundle promotions securely.",
        iconColor: "text-indigo-600",
        borderColor: "border-indigo-100",
        bgLight: "bg-indigo-50/50",
        accent: "bg-indigo-500"
    },
    {
        id: "services",
        icon: Briefcase,
        title: "Service Agencies",
        tagline: "Professional Billing",
        description: "Generate compliant tax invoices for your clients. Track project-based expenses and maintain clear P&L documentation.",
        iconColor: "text-fuchsia-600",
        borderColor: "border-fuchsia-100",
        bgLight: "bg-fuchsia-50/50",
        accent: "bg-fuchsia-500"
    },
    {
        id: "credit",
        icon: HandCoins,
        title: "Finance & Credit",
        tagline: "Digital Ledger",
        description: "Replace physical registers. Experience transparent, secure credit tracking with automated SMS reminders.",
        iconColor: "text-orange-600",
        borderColor: "border-orange-100",
        bgLight: "bg-orange-50/50",
        accent: "bg-orange-500"
    }
]

export function SolutionsSection({ isFullPage = false }: { isFullPage?: boolean }) {
    if (isFullPage) {
        return (
            <section className="py-20 px-6 bg-transparent relative z-10 w-full">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    {SOLUTIONS.map((solution, i) => (
                        <motion.div
                            key={solution.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: i * 0.1 }}
                            viewport={{ once: true, margin: "-100px" }}
                        >
                            <IndustryCard solution={solution} />
                        </motion.div>
                    ))}
                </div>
            </section>
        )
    }

    return <SolutionsAnimatedSection />
}

function SolutionsAnimatedSection() {
    const ref = useRef(null)

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end end"],
    })

    // Smooth out the progress for the background atmospheric elements
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    })

    const displaySolutions = SOLUTIONS.slice(0, 4);

    return (
        <section ref={ref} id="solutions" className="relative h-[400vh] bg-transparent">
            <div className="sticky top-0 h-screen flex items-center overflow-hidden">

                {/* SARVAM-STYLE RADIANCE - CENTERPIECE */}
                <div className="absolute inset-x-0 bottom-0 top-0 pointer-events-none z-0 overflow-hidden"
                    style={{ maskImage: "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)" }}
                >
                    <motion.div
                        style={{
                            scale: useTransform(smoothProgress, [0, 1], [0.9, 1.3]),
                            opacity: useTransform(smoothProgress, [0, 0.5, 1], [0.45, 0.65, 0.45]),
                            x: useTransform(smoothProgress, [0, 1], ["-12%", "12%"])
                        }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vw] bg-[radial-gradient(circle,rgba(16,185,129,0.28)_0%,rgba(59,130,246,0.15)_45%,transparent_70%)] blur-[160px] rounded-full"
                    />

                    {/* Noise texture for depth */}
                    <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }} />
                </div>

                <div className="grid md:grid-cols-2 max-w-7xl mx-auto w-full px-6 gap-12 lg:gap-24 items-center">

                    {/* Left: Sticky Static Narrative */}
                    <div className="flex flex-col justify-center space-y-8">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                        >
                            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 mb-6">
                                <ShieldCheck size={14} className="text-emerald-600" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">Specialized Intelligence</span>
                            </div>
                            <h2 className="text-6xl md:text-8xl font-bold tracking-tighter text-zinc-900 leading-[1.05]">
                                Tailored for <br />
                                <span className="text-zinc-400">your industry.</span>
                            </h2>
                            <p className="max-w-md text-zinc-500 text-xl md:text-2xl font-light tracking-tight mt-8 leading-relaxed">
                                One unified platform that intuitively adapts to the unique pulse of your specific business.
                            </p>
                        </motion.div>
                    </div>

                    {/* Right: Cross-fading Animated Stack */}
                    <div className="relative h-[500px] flex items-center justify-center">
                        {displaySolutions.map((solution, i) => (
                            <AnimatedSolutionCard
                                key={solution.id}
                                solution={solution}
                                index={i}
                                scrollYProgress={scrollYProgress}
                            />
                        ))}
                    </div>

                </div>
            </div>
        </section>
    )
}

function AnimatedSolutionCard({ solution, index, scrollYProgress }: { solution: any, index: number, scrollYProgress: any }) {
    const start = index * 0.25
    const end = start + 0.25

    const opacity = useTransform(
        scrollYProgress,
        [start, start + 0.05, end - 0.05, end],
        [0, 1, 1, 0]
    )

    const scale = useTransform(
        scrollYProgress,
        [start, start + 0.15, end],
        [0.9, 1, 0.95]
    )

    const y = useTransform(
        scrollYProgress,
        [start, start + 0.25],
        [20, -20]
    )

    return (
        <motion.div
            style={{ opacity, scale, y }}
            className="absolute inset-0 flex items-center"
        >
            <IndustryCard solution={solution} />
        </motion.div>
    )
}

function IndustryCard({ solution }: { solution: any }) {
    return (
        <div className={cn(
            "w-full bg-white rounded-[2.5rem] shadow-[0_40px_100px_-15px_rgba(0,0,0,0.1)] p-10 md:p-14 border border-zinc-100 flex flex-col justify-between group overflow-hidden relative",
            solution.bgLight
        )}>
            <div className={cn("absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full opacity-10 group-hover:opacity-20 transition-opacity", solution.accent)} />

            <div className="relative z-10 space-y-10">
                <div className="flex justify-between items-start">
                    <div className={cn("w-20 h-20 rounded-3xl flex items-center justify-center border border-zinc-100 bg-white shadow-sm transition-transform duration-500 group-hover:scale-110", solution.iconColor)}>
                        <solution.icon size={36} strokeWidth={1.5} />
                    </div>
                    <div className="w-12 h-12 rounded-full border border-zinc-100 flex items-center justify-center text-zinc-300 bg-white">
                        <ArrowRight size={20} />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className={cn("text-[11px] font-bold uppercase tracking-[0.25em] mb-4", solution.iconColor)}>
                        {solution.tagline}
                    </div>
                    <h3 className="text-4xl font-bold tracking-tight text-zinc-900 leading-tight">
                        {solution.title}
                    </h3>
                    <p className="text-zinc-500 text-lg font-light leading-relaxed max-w-sm">
                        {solution.description}
                    </p>
                </div>

                <div className="pt-6 flex items-center gap-3">
                    <div className={cn("w-1.5 h-1.5 rounded-full", solution.accent)} />
                    <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Integrated Intelligence</div>
                </div>
            </div>
        </div>
    )
}
