"use client"

import { Check, WifiOff, Zap, ShieldCheck, Database, RefreshCw } from "lucide-react"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { cn } from "@/lib/utils"

export function OfflineModeSection({ whiteTheme = false }: { whiteTheme?: boolean }) {
    return (
        <section id="offline" className={cn("py-24 md:py-40 relative overflow-hidden", whiteTheme ? "bg-white text-zinc-900" : "bg-zinc-950 text-white")}>
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="flex flex-col lg:flex-row-reverse items-center gap-20">
                    <div className="w-full lg:w-1/2 space-y-12">
                        <AdvancedScrollReveal variant="slideLeft">
                            <div className="space-y-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em]">
                                    <WifiOff size={14} />
                                    Zero Connectivity
                                </div>
                                <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.95]">
                                    Engineered for <br />
                                    <span className={whiteTheme ? "text-zinc-400" : "text-zinc-500"}>The Real World.</span>
                                </h2>
                                <p className={cn("text-xl font-medium leading-relaxed max-w-xl", whiteTheme ? "text-zinc-500" : "text-zinc-400")}>
                                    Don't let patchy internet cripple your checkout counter. KhataPlus functions 100% offline, storing data locally and syncing in the background when the web returns.
                                </p>
                            </div>
                        </AdvancedScrollReveal>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <FeatureItem
                                icon={Database}
                                title="Local Sandbox"
                                desc="Military-grade local encryption for your shop data."
                            />
                            <FeatureItem
                                icon={RefreshCw}
                                title="Background Sync"
                                desc="Atomic commits that never fail, even on 2G."
                            />
                            <FeatureItem
                                icon={Zap}
                                title="Instant Action"
                                desc="0ms UI latency, even with 10k+ items."
                            />
                            <FeatureItem
                                icon={Check}
                                title="Conflict Proof"
                                desc="Smart merge tech that prevents data loss."
                            />
                        </div>
                    </div>

                    <div className="w-full lg:w-1/2 relative">
                        <AdvancedScrollReveal variant="scaleUp">
                            <div className="relative group">
                                <div className="absolute -inset-10 bg-emerald-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                                <div className={cn("relative border rounded-[3.5rem] p-12 overflow-hidden shadow-2xl", whiteTheme ? "bg-white border-zinc-200" : "bg-zinc-900 border-white/5")}>
                                    <div className="flex justify-between items-center mb-12">
                                        <div className="space-y-1">
                                            <div className="h-1 w-8 bg-emerald-500 rounded-full" />
                                            <div className="text-xs font-black uppercase tracking-widest text-zinc-500">Device Status</div>
                                        </div>
                                        <div className={cn("flex items-center gap-3 px-4 py-2 rounded-full border", whiteTheme ? "bg-zinc-50 border-zinc-200" : "bg-zinc-950 border-white/5")}>
                                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Offline Mode</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className={cn("flex items-center gap-4 p-4 rounded-2xl border transition-colors", whiteTheme ? "bg-zinc-50 border-zinc-200" : "bg-white/5 border-white/5 group-hover:bg-white/10")}>
                                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400", whiteTheme ? "bg-white border border-zinc-200 shadow-sm" : "bg-zinc-950")}>
                                                    <div className={cn("h-4 w-4 rounded-sm", whiteTheme ? "bg-zinc-200" : "bg-zinc-800")} />
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <div className={cn("h-2 w-1/2 rounded-full", whiteTheme ? "bg-zinc-200" : "bg-zinc-800")} />
                                                    <div className={cn("h-2 w-1/4 rounded-full", whiteTheme ? "bg-zinc-100" : "bg-zinc-800/50")} />
                                                </div>
                                                <div className="text-[10px] font-black uppercase tracking-tighter text-emerald-500/50 italic">Cached</div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-12 p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                                        <div className="text-emerald-400 font-bold text-sm">Waiting for Network...</div>
                                        <div className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">12 Sales Pending Sync</div>
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

function FeatureItem({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <Icon size={16} />
                </div>
                <h4 className="text-lg font-black italic tracking-tighter text-white">{title}</h4>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed font-medium">{desc}</p>
        </div>
    )
}
