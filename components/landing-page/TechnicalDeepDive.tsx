"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Database, Shield, WifiOff, FileText, Cpu, Lock, Zap, Server, Globe, Fingerprint } from "lucide-react"
import { cn } from "@/lib/utils"

const layers = [
    {
        id: "infra",
        icon: Server,
        title: "Sovereign Infrastructure",
        subtitle: "Built for data sovereignty and multi-region resilience.",
        description: "KhataPlus runs on a distributed lattice of nodes, ensuring your business data never leaves the safety of sovereign cloud boundaries while maintaining edge-performance for every transaction.",
        details: [
            { icon: Globe, label: "Edge-First Nodes", value: "Real-time global latency" },
            { icon: Cpu, label: "Merchant Compute", value: "Dedicated VPC units" }
        ],
        visual: "InfraVisual"
    },
    {
        id: "offline",
        icon: WifiOff,
        title: "Deterministic Offline Mode",
        subtitle: "Zero-dependency computing for patchy connectivity.",
        description: "Powered by a battle-tested atomic commit engine. KhataPlus functions 100% offline, storing data in a local encrypted sandbox and syncing via background diff-streaming when the web returns.",
        details: [
            { icon: Zap, label: "Sync Engine", value: "Differential state transfer" },
            { icon: Database, label: "Local Vault", value: "AES-256 local storage" }
        ],
        visual: "OfflineVisual"
    },
    {
        id: "gst",
        icon: FileText,
        title: "Native Tax Logic",
        subtitle: "HSN-level precision for error-free compliance.",
        description: "The GST engine is built directly into the core platform, not an add-on. Generate E-Way bills, tax invoices, and GSTR-1 reports with absolute precision and 0-latency calculation times.",
        details: [
            { icon: FileText, label: "Tax Engine", value: "Native Rust-powered" },
            { icon: CheckIcon, label: "Compliance", value: "Audit-ready logs" }
        ],
        visual: "GstVisual"
    },
    {
        id: "security",
        icon: Shield,
        title: "Advanced Safeguards",
        subtitle: "Military-grade privacy for commercial data.",
        description: "Your records are protected by hardware-level encryption and biometric authentication. Multi-factor authentication and granular role-based access control ensure only authorized staff can access sensitive logs.",
        details: [
            { icon: Lock, label: "MFA", value: "Biometric & TOTP" },
            { icon: Fingerprint, label: "Access Control", value: "Granular RBAC" }
        ],
        visual: "SecurityVisual"
    }
]

function CheckIcon({ size }: { size: number }) {
    return <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
}

export function TechnicalDeepDive() {
    const [activeLayer, setActiveLayer] = useState(layers[0])

    return (
        <section className="relative py-32 md:py-48 bg-[#050505] overflow-hidden border-t border-white/5">
            {/* Technical Grid Background */}
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black to-transparent z-0" />
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-[url('/grid.svg')] bg-[length:60px_60px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-blue-500/5 rounded-full blur-[200px] pointer-events-none" />

            <div className="max-w-[1400px] mx-auto px-6 relative z-10">
                <div className="flex flex-col gap-12 lg:gap-24">

                    {/* Header */}
                    <div className="max-w-3xl space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                            Technical Core
                        </div>
                        <h2 className="text-[3rem] md:text-[5rem] font-semibold tracking-[-0.03em] leading-[0.9] text-white">
                            The Engine <br />
                            <span className="text-zinc-600 font-normal italic">of Trust.</span>
                        </h2>
                        <p className="text-xl text-zinc-400 font-normal leading-relaxed max-w-xl">
                            KhataPlus is built on a high-performance, sovereign architecture designed to survive
                            the complexities of population-scale commerce.
                        </p>
                    </div>

                    {/* Main Interaction Area */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">

                        {/* Selector Column */}
                        <div className="lg:col-span-5 space-y-4">
                            {layers.map((layer) => (
                                <button
                                    key={layer.id}
                                    onClick={() => setActiveLayer(layer)}
                                    className={cn(
                                        "w-full text-left p-8 rounded-[2rem] border transition-all duration-500 group relative overflow-hidden",
                                        activeLayer.id === layer.id
                                            ? "bg-white/[0.03] border-white/20 shadow-3xl"
                                            : "bg-transparent border-white/5 hover:border-white/10"
                                    )}
                                >
                                    <div className="flex items-center gap-6 relative z-10">
                                        <div className={cn(
                                            "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500",
                                            activeLayer.id === layer.id
                                                ? "bg-white text-black shadow-2xl"
                                                : "bg-white/5 text-zinc-500 group-hover:text-white group-hover:bg-white/10"
                                        )}>
                                            <layer.icon size={24} />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className={cn(
                                                "text-2xl font-semibold tracking-tight transition-colors duration-500",
                                                activeLayer.id === layer.id ? "text-white" : "text-zinc-500"
                                            )}>{layer.title}</h3>
                                            <p className="text-sm text-zinc-600 font-normal">{layer.subtitle}</p>
                                        </div>
                                    </div>

                                    {/* Animated Progress Line */}
                                    {activeLayer.id === layer.id && (
                                        <motion.div
                                            layoutId="active-border"
                                            className="absolute left-0 top-0 bottom-0 w-1 bg-white"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Content & Visual Area */}
                        <div className="lg:col-span-7 relative h-[600px] flex flex-col pt-4">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeLayer.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                    className="flex flex-col h-full"
                                >
                                    {/* Description Area */}
                                    <div className="space-y-8 mb-16">
                                        <p className="text-2xl text-zinc-400 font-normal leading-relaxed">
                                            {activeLayer.description}
                                        </p>
                                        <div className="grid grid-cols-2 gap-8">
                                            {activeLayer.details.map((detail, idx) => (
                                                <div key={idx} className="flex gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400">
                                                        <detail.icon size={18} />
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold uppercase tracking-widest text-zinc-600">{detail.label}</div>
                                                        <div className="text-white font-semibold">{detail.value}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Visual Blueprint Area */}
                                    <div className="flex-1 relative bg-white/[0.02] border border-white/5 rounded-[3rem] overflow-hidden p-12">
                                        <VisualRenderer id={activeLayer.visual} />
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function VisualRenderer({ id }: { id: string }) {
    // Placeholder visuals for now
    return (
        <div className="w-full h-full flex items-center justify-center">
            <div className="relative w-full aspect-video border border-dashed border-white/20 rounded-3xl flex flex-col items-center justify-center gap-6 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-700">{id}</div>
                <div className="grid grid-cols-8 gap-4 w-2/3 opacity-20">
                    {Array.from({ length: 16 }).map((_, i) => (
                        <div key={i} className="h-1 bg-white rounded-full" />
                    ))}
                </div>
            </div>
        </div>
    )
}
