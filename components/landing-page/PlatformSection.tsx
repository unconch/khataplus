"use client"

import { Database, ShieldCheck, Zap, Activity, Cpu } from "lucide-react"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"

const ENGINE_FEATURES = [
    {
        id: "offline",
        title: "Works Offline",
        icon: Database,
        description: "Keep billing even when the internet drops. Your data is instantly saved locally on your device, allowing you to continue adding items and creating bills without any interruptions.",
        glowStr: "from-cyan-400/40 via-blue-200/20 to-transparent",
        bgHover: "hover:bg-cyan-50/50",
        borderHover: "group-hover:border-cyan-200",
        iconColor: "text-cyan-600"
    },
    {
        id: "sync",
        title: "Auto Sync",
        icon: Zap,
        description: "As soon as your connection is restored, all offline bills and changes are automatically backed up to the cloud. No manual clicks required—everything stays perfectly up-to-date in the background.",
        glowStr: "from-blue-400/40 via-indigo-200/20 to-transparent",
        bgHover: "hover:bg-blue-50/50",
        borderHover: "group-hover:border-blue-200",
        iconColor: "text-blue-600"
    },
    {
        id: "security",
        title: "Secure Data",
        icon: ShieldCheck,
        description: "Your business information is locked with enterprise-grade encryption. Whether data is stored on your device or syncing online, it remains completely private and protected from unauthorized access.",
        glowStr: "from-fuchsia-400/40 via-pink-200/20 to-transparent",
        bgHover: "hover:bg-fuchsia-50/50",
        borderHover: "group-hover:border-fuchsia-200",
        iconColor: "text-fuchsia-600"
    },
    {
        id: "perf",
        title: "Fast Performance",
        icon: Activity,
        description: "Engineered for speed to keep your checkout lines moving. Whether you have 10 products or 10,000, our system instantly searches items and accurately generates bills during your busiest hours.",
        glowStr: "from-emerald-400/40 via-teal-200/20 to-transparent",
        bgHover: "hover:bg-emerald-50/50",
        borderHover: "group-hover:border-emerald-200",
        iconColor: "text-emerald-600"
    }
]

export function PlatformSection() {
    return (
        <section id="platform" className="py-20 md:py-24 px-6 bg-transparent relative overflow-hidden text-zinc-900">
            {/* Tech Background Atmosphere - Faded Boundary */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
                style={{ maskImage: "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)" }}
            >
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:32px_32px] opacity-60 mix-blend-multiply" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-300/30 blur-[150px] rounded-full mix-blend-multiply" />
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
                <div className="text-center mb-20 space-y-4 flex flex-col items-center">
                    <AdvancedScrollReveal variant="slideUp">
                        <h2 className="text-5xl md:text-7xl font-semibold tracking-tighter leading-[1.05]">
                            The Core <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500">Engine.</span>
                        </h2>
                        <p className="text-zinc-500 text-xl font-light tracking-wide max-w-2xl mx-auto mt-8">
                            Fast. Reliable. Secure. Powered by our proprietary local-first architecture.
                        </p>
                    </AdvancedScrollReveal>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 relative">
                    {/* Connecting "Circuit" Lines */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[2px] bg-zinc-200 hidden md:block" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-[2px] bg-zinc-200 hidden md:block" />

                    {/* Glowing active node center */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-white border-4 border-cyan-400 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.5)] hidden md:block z-20" />

                    {ENGINE_FEATURES.map((feature, index) => (
                        <FeatureBlock key={feature.id} feature={feature} index={index} />
                    ))}
                </div>
            </div>
        </section>
    )
}

function FeatureBlock({ feature, index }: { feature: typeof ENGINE_FEATURES[0], index: number }) {
    return (
        <AdvancedScrollReveal
            variant="slideUp"
            delay={index * 100}
            className={`group relative bg-white rounded-3xl p-8 md:p-10 border border-zinc-200/80 transition-all duration-500 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] z-10 ${feature.bgHover}`}
        >
            {/* Dynamic Hover Glow */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-gradient-to-br ${feature.glowStr} mix-blend-multiply`} />
            <div className={`absolute inset-0 rounded-3xl border border-transparent transition-colors duration-700 pointer-events-none ${feature.borderHover}`} />

            <div className="flex flex-col h-full relative z-10 space-y-8">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border border-zinc-100 bg-white shadow-sm transition-transform duration-500 group-hover:scale-110 backdrop-blur-md ${feature.iconColor}`}>
                    <feature.icon size={28} strokeWidth={1.5} />
                </div>

                <div className="space-y-4">
                    <h3 className="text-2xl font-semibold tracking-tight text-zinc-900 group-hover:text-black transition-colors">{feature.title}</h3>
                    <p className="text-zinc-500 leading-relaxed font-light min-h-[80px] text-lg">{feature.description}</p>
                </div>

                {/* Progress-like Tech Bar */}
                <div className="h-1 w-full bg-zinc-100 rounded-full overflow-hidden mt-6">
                    <div className={`h-full w-12 rounded-full transition-all duration-1000 group-hover:w-full bg-gradient-to-r ${feature.glowStr.split(' ')[0]} to-transparent opacity-50 group-hover:opacity-100`} />
                </div>
            </div>
        </AdvancedScrollReveal>
    )
}
