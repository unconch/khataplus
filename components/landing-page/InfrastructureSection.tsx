"use client"

import Image from "next/image"
import { Check, Shield } from "lucide-react"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"

export function InfrastructureSection() {
    return (
        <section className="py-24 bg-zinc-900 overflow-hidden relative">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row items-center gap-16">
                    <div className="w-full md:w-1/2">
                        <AdvancedScrollReveal variant="slideRight">
                            <span className="text-emerald-400 font-semibold text-sm tracking-wider uppercase bg-emerald-500/10 px-3 py-1 rounded-full">Infrastructure</span>
                            <h2 className="text-3xl md:text-5xl font-bold text-white mt-6 mb-6">Built for scale,<br />designed for speed.</h2>
                            <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
                                Our architecture handles millions of transactions with sub-millisecond latency. Whether you're a small shop or a retail chain, we grow with you.
                            </p>

                            <div className="space-y-4">
                                {[
                                    { title: "Zero Downtime", desc: "Redundant systems ensure 99.99% uptime." },
                                    { title: "End-to-End Encryption", desc: "AES-256 encryption for all your financial data." },
                                    { title: "Real-time Sync", desc: "Changes reflect instantly across all devices." }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                                            <Check size={14} className="text-emerald-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-medium">{item.title}</h4>
                                            <p className="text-zinc-500 text-sm">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </AdvancedScrollReveal>
                    </div>

                    <div className="w-full md:w-1/2">
                        <AdvancedScrollReveal variant="scaleUp">
                            <div
                                className="relative w-full aspect-square md:aspect-video group"
                            >
                                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                                <div className="relative h-full w-full rounded-2xl overflow-hidden border border-white/10 bg-black/50 backdrop-blur-sm shadow-2xl">
                                    <Image
                                        src="/images/hero-viz.png"
                                        alt="Visualization"
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-60"></div>

                                    {/* Floating Interactive Elements */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-emerald-500 blur-[80px] opacity-20" />
                                        </div>
                                    </div>

                                    <div
                                        className="absolute bottom-6 right-6 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 max-w-[200px] hover:bg-white/20 transition-colors shadow-lg animate-in fade-in slide-up animation-delay-500"
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <Shield className="w-4 h-4 text-emerald-400" />
                                            <span className="text-xs font-bold text-white uppercase tracking-wider">Secured</span>
                                        </div>
                                        <div className="text-xs text-zinc-300">Enterprise Grade Security Protocol Active</div>
                                    </div>
                                </div>
                            </div>
                        </AdvancedScrollReveal>
                    </div>
                </div>
            </div>
        </section>
    )
}
