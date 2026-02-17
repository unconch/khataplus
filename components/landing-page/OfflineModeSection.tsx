"use client"

import { Check, WifiOff } from "lucide-react"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"

export function OfflineModeSection() {
    return (
        <section id="offline" className="py-24 md:py-32 px-6 overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row-reverse items-center gap-16">
                    <div className="w-full md:w-1/2">
                        <AdvancedScrollReveal variant="slideLeft">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-sm font-semibold mb-6">
                                <WifiOff size={16} />
                                Works Anywhere
                            </div>
                            <h2 className="text-3xl md:text-5xl font-bold text-zinc-900 mb-6">Built for the real world.</h2>
                            <p className="text-zinc-600 text-xl mb-8 leading-relaxed">
                                Don't let patchy internet stop your business. KhataPlus works fully offline and syncs automatically when you're back online.
                            </p>
                            <ul className="space-y-4">
                                {[
                                    "Continue billing without internet",
                                    "Seamless background synchronization",
                                    "Local data storage on your device",
                                    "Instant performance, zero lag"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-zinc-700">
                                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                                            <Check size={12} className="text-emerald-600" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </AdvancedScrollReveal>
                    </div>
                    <div className="w-full md:w-1/2 relative">
                        <AdvancedScrollReveal variant="scaleUp">
                            <div className="relative bg-zinc-100 rounded-3xl p-8 aspect-square flex items-center justify-center overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-amber-200/20 to-emerald-200/20" />
                                <div
                                    className="relative z-10 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-pulse-subtle"
                                >
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="h-6 w-24 bg-zinc-100 rounded" />
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 rounded-full bg-amber-400" />
                                            <span className="text-[10px] font-mono text-zinc-400 tracking-tighter">OFFLINE MODE</span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="h-10 bg-zinc-50 rounded-lg flex items-center px-4 border border-zinc-100">
                                            <div className="h-2 w-full bg-zinc-200 rounded" />
                                        </div>
                                        <div className="h-10 bg-zinc-50 rounded-lg flex items-center px-4 border border-zinc-100">
                                            <div className="h-2 w-3/4 bg-zinc-200 rounded" />
                                        </div>
                                        <div className="h-10 bg-emerald-50 rounded-lg flex items-center px-4 border border-emerald-100">
                                            <div className="h-2 w-full bg-emerald-200 rounded" />
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />
                                <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl" />
                            </div>
                        </AdvancedScrollReveal>
                    </div>
                </div>
            </div>
        </section>
    )
}
