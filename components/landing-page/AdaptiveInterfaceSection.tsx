"use client"

import { useState } from "react"
import { Monitor, Smartphone, Layout, Zap, Layers, Bell, Shield, Cloud, HardDrive } from "lucide-react"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"
import { cn } from "@/lib/utils"

export function AdaptiveInterfaceSection() {
    const [activeTab, setActiveTab] = useState<"desktop" | "pwa">("desktop")

    return (
        <section id="interface" className="py-12 md:py-20 px-6 bg-zinc-950 text-white relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col lg:flex-row items-center justify-between mb-10 gap-8">
                    <AdvancedScrollReveal variant="slideRight">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-emerald-400">
                                <Layers size={10} />
                                <span className="font-black text-[9px] tracking-widest uppercase">Everything Stays Synced</span>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-none uppercase italic">
                                One App. <span className="text-zinc-500">Works Everywhere.</span>
                            </h2>
                        </div>
                    </AdvancedScrollReveal>

                    <div className="flex items-center justify-center p-1 bg-white/5 rounded-xl border border-white/10 backdrop-blur-xl">
                        {[
                            { id: "desktop" as const, label: "On Desktop", icon: Monitor },
                            { id: "pwa" as const, label: "On Mobile", icon: Smartphone }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-2 rounded-lg transition-all duration-500 font-black text-[10px] uppercase tracking-widest",
                                    activeTab === t.id ? "bg-white text-zinc-950 shadow-lg" : "text-zinc-500 hover:text-white"
                                )}
                            >
                                <t.icon size={14} /> {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="relative">
                    <AdvancedScrollReveal variant="scaleUp">
                        <div className="relative w-full max-w-5xl mx-auto rounded-[2.5rem] bg-zinc-900 border border-white/5 shadow-2xl overflow-hidden group min-h-[400px]">
                            {/* Filling the space with a grid background and data noise */}
                            <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:20px_20px]" />

                            <div className="relative z-10 p-6 md:p-10 h-full">
                                {activeTab === "desktop" ? (
                                    <div className="flex flex-col md:flex-row gap-6 animate-in fade-in duration-700 h-full items-stretch">
                                        <div className="w-full md:w-56 bg-black/40 rounded-2xl border border-white/10 p-5 space-y-4">
                                            <div className="h-4 w-24 bg-white/10 rounded-full" />
                                            <div className="space-y-2 pt-4">
                                                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-8 w-full bg-white/5 rounded-xl border border-white/5" />)}
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-6">
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {[
                                                    { label: "Daily Sale", val: "₹18.4k" },
                                                    { label: "Item Stock", val: "₹4.2L" },
                                                    { label: "Customer List", val: "1,202" }
                                                ].map((stat, i) => (
                                                    <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                                        <div className="text-[8px] font-black uppercase text-zinc-500 mb-1">{stat.label}</div>
                                                        <div className="text-lg font-black italic">{stat.val}</div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="bg-black/40 rounded-3xl border border-white/10 p-6">
                                                <div className="flex justify-between items-center mb-6">
                                                    <div className="h-3 w-32 bg-white/10 rounded-full" />
                                                    <div className="h-6 w-16 bg-emerald-500/10 rounded-full border border-emerald-500/20" />
                                                </div>
                                                <div className="space-y-2">
                                                    {[1, 2, 3].map(i => (
                                                        <div key={i} className="flex gap-4 items-center">
                                                            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5" />
                                                            <div className="h-2 flex-1 bg-white/5 rounded-full" />
                                                            <div className="h-2 w-12 bg-white/10 rounded-full" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center animate-in fade-in zoom-in duration-700">
                                        {/* Left Side: System Status */}
                                        <div className="hidden lg:flex flex-col gap-4">
                                            <StatusCard icon={Zap} title="Bina Internet" status="Available" color="text-amber-500" />
                                            <StatusCard icon={HardDrive} title="Memory" status="Optimized" color="text-blue-500" />
                                            <StatusCard icon={Bell} title="WhatsApp Notifications" status="Ready" color="text-emerald-500" />
                                        </div>

                                        {/* Center: Mobile Mockup - Larger */}
                                        <div className="flex justify-center relative">
                                            <div className="absolute inset-0 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
                                            <div className="w-[200px] md:w-[220px] aspect-[9/19] rounded-[2.5rem] border-[6px] border-zinc-800 bg-black shadow-2xl relative overflow-hidden ring-4 ring-white/5">
                                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-zinc-800 rounded-b-xl z-20" />
                                                <div className="p-4 pt-8 space-y-4">
                                                    <div className="h-28 bg-gradient-to-br from-emerald-600 to-teal-500 rounded-2xl p-4 flex flex-col justify-between">
                                                        <div className="h-2 w-10 bg-white/30 rounded" />
                                                        <div className="space-y-1">
                                                            <div className="text-[7px] font-black uppercase text-white/60">Balance Today</div>
                                                            <div className="text-lg font-black italic text-white leading-none">₹8,402</div>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {[
                                                            { label: 'Sale', icon: Layout },
                                                            { label: 'Stock', icon: Layers },
                                                            { label: 'Cloud', icon: Cloud },
                                                            { label: 'Vault', icon: Shield }
                                                        ].map((item, i) => (
                                                            <div key={i} className="aspect-square bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-1.5 group/icon transition-colors hover:bg-white/10">
                                                                <item.icon size={16} className="text-zinc-500 group-hover/icon:text-emerald-500" />
                                                                <span className="text-[6px] font-black uppercase tracking-widest text-zinc-600">{item.label}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Side: Deployment Stats */}
                                        <div className="hidden lg:flex flex-col gap-4">
                                            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Live Syncing</div>
                                                <div className="space-y-3">
                                                    {[
                                                        { label: "Other Devices", val: "Connected" },
                                                        { label: "Data Safety", val: "Verified" },
                                                        { label: "Sync Speed", val: "Fast" }
                                                    ].map((item, i) => (
                                                        <div key={i} className="flex justify-between items-center text-[9px] font-bold">
                                                            <span className="text-zinc-400 capitalize">{item.label}</span>
                                                            <span className="text-white">{item.val}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500 w-[92%] animate-[shimmer_2s_infinite]" />
                                                </div>
                                            </div>
                                            <div className="p-6 rounded-3xl bg-zinc-800/50 border border-white/5 backdrop-blur-sm">
                                                <p className="text-[10px] font-medium text-zinc-500 leading-relaxed italic">
                                                    "Whether on Desktop or Mobile, KhataPlus runs everywhere without manual setup."
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </AdvancedScrollReveal>

                    {/* Footer Features - Tight & Semantic */}
                    <div className="mt-8 flex flex-wrap justify-between gap-6 px-4">
                        <SimpleFeature icon={Monitor} title="Billing Counter" desc="Works on PC." />
                        <SimpleFeature icon={Smartphone} title="Mobile Billing" desc="Use your phone." />
                        <SimpleFeature icon={Zap} title="Always Sync" desc="Data is always safe." />
                    </div>
                </div>
            </div>
        </section>
    )
}

function StatusCard({ icon: Icon, title, status, color }: any) {
    return (
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4 group hover:bg-white/10 transition-all">
            <div className={cn("w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center", color)}>
                <Icon size={16} />
            </div>
            <div>
                <div className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">{title}</div>
                <div className="text-xs font-black text-white">{status}</div>
            </div>
        </div>
    )
}

function SimpleFeature({ icon: Icon, title, desc }: any) {
    return (
        <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-zinc-400">
                <Icon size={12} />
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-white leading-none mb-0.5">{title}</span>
                <span className="text-[8px] font-medium text-zinc-500 leading-none">{desc}</span>
            </div>
        </div>
    )
}
