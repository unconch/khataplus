"use client"

import { Server, Zap, Shield, Database, Cpu, Lock } from "lucide-react"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { cn } from "@/lib/utils"

export function InfrastructureSection() {
    return (
        <section id="infrastructure" className="py-24 md:py-40 bg-white relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col lg:flex-row items-center gap-20 md:gap-32">
                    {/* Visual Column */}
                    <div className="flex-1 w-full order-2 lg:order-1">
                        <AdvancedScrollReveal variant="scaleUp">
                            <div className="relative p-1 bg-gradient-to-tr from-zinc-200 to-zinc-100 rounded-[3.5rem]">
                                <div className="relative bg-white rounded-[3.2rem] p-12 overflow-hidden border border-zinc-200 shadow-2xl">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-[80px] -mr-32 -mt-32" />
                                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-50 rounded-full blur-[80px] -ml-32 -mb-32" />

                                    <div className="relative z-10 space-y-12">
                                        <div className="grid grid-cols-2 gap-4">
                                            <InfraMetric icon={Zap} title="99.99%" label="System Uptime" color="emerald" />
                                            <InfraMetric icon={Cpu} title="<150ms" label="API Latency" color="blue" />
                                            <InfraMetric icon={Database} title="Hourly" label="Offsite Backups" color="indigo" />
                                            <InfraMetric icon={Lock} title="AES-256" label="Encryption" color="zinc" />
                                        </div>

                                        <div className="p-8 rounded-3xl bg-zinc-950 text-white relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-4">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Security Protocol</div>
                                                <h4 className="text-xl font-bold italic tracking-tight">Active Shielding Enabled</h4>
                                                <p className="text-zinc-500 text-xs">Continuous monitoring and automated
                                                    threat detection active across all nodes.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </AdvancedScrollReveal>
                    </div>

                    {/* Content Column */}
                    <div className="flex-1 space-y-12 order-1 lg:order-2 text-center lg:text-left">
                        <AdvancedScrollReveal variant="slideLeft">
                            <div className="space-y-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200/50">
                                    <Server size={14} className="text-zinc-900" />
                                    <span className="text-zinc-900 font-bold text-[10px] tracking-widest uppercase">Infrastructure</span>
                                </div>
                                <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-zinc-900 leading-[0.9]">
                                    Engineered for <br />
                                    <GradientText className="inline" colors={["#000000", "#71717a", "#27272a"]}>
                                        Total Reliability.
                                    </GradientText>
                                </h2>
                                <p className="text-zinc-500 text-xl font-medium leading-relaxed max-w-lg mx-auto lg:mx-0">
                                    Our cloud architecture is built to handle millions of transactions simultaneously with zero lag. We've optimized every layer for speed and security.
                                </p>
                            </div>
                        </AdvancedScrollReveal>

                        <div className="space-y-8">
                            {[
                                { title: "Geo-Distributed Nodes", desc: "Low latency access from every corner of India." },
                                { title: "Automated Failover", desc: "Redundant systems that switch in milliseconds." },
                                { title: "Zero Trust Architecture", desc: "No data is ever exposed, even within our private network." }
                            ].map((item, i) => (
                                <AdvancedScrollReveal key={i} variant="slideUp" delay={200 + (i * 100)}>
                                    <div className="flex flex-col md:flex-row items-center lg:items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-900 border border-zinc-100 flex-shrink-0">
                                            <Shield size={18} />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-lg font-black italic tracking-tight text-zinc-900 leading-none">{item.title}</h4>
                                            <p className="text-zinc-500 text-sm font-medium">{item.desc}</p>
                                        </div>
                                    </div>
                                </AdvancedScrollReveal>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function InfraMetric({ icon: Icon, title, label, color }: { icon: any, title: string, label: string, color: string }) {
    const colorStyles: any = {
        emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
        blue: "text-blue-600 bg-blue-50 border-blue-100",
        indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
        zinc: "text-zinc-600 bg-zinc-50 border-zinc-100"
    }

    return (
        <div className="p-6 rounded-3xl bg-white border border-zinc-100 shadow-sm hover:shadow-md transition-all duration-300">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform", colorStyles[color])}>
                <Icon size={18} />
            </div>
            <div>
                <div className="text-2xl font-black tracking-tighter text-zinc-900 leading-none mb-1">{title}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</div>
            </div>
        </div>
    )
}
