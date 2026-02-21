"use client"

import { useState } from "react"
import {
    WifiOff, TrendingUp, ShieldCheck, FileText,
    Zap, Server, Lock, Database, Smartphone, ArrowRight,
    Activity, Globe, Terminal, Cpu, Search, Check
} from "lucide-react"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { cn } from "@/lib/utils"

const FEATURES = [
    {
        id: "offline",
        title: "Offline Mode",
        badge: "Always On",
        icon: WifiOff,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        description: "Billing continues even if your internet goes down. Everything syncs once you're back online.",
        highlights: ["Works Offline", "Fast Sync", "No Data Loss"],
        mockupType: "offline"
    },
    {
        id: "gst",
        title: "GST Billing",
        badge: "Tax Ready",
        icon: FileText,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        description: "Professional invoices made easy. Automated tax calculations to keep your accounts perfect.",
        highlights: ["Easy GST", "B2B / B2C", "Fast Print"],
        mockupType: "gst"
    },
    {
        id: "analytics",
        title: "Profit Insights",
        badge: "Daily Reports",
        icon: TrendingUp,
        color: "text-indigo-500",
        bg: "bg-indigo-500/10",
        description: "Track your daily sales and margins. Know exactly which products are making money.",
        highlights: ["Profit Track", "Top Items", "Daily Summary"],
        mockupType: "analytics"
    },
    {
        id: "security",
        title: "Safe & Private",
        badge: "Data Privacy",
        icon: ShieldCheck,
        color: "text-rose-500",
        bg: "bg-rose-500/10",
        description: "Your business data is private and secured with encryption. Only you have access.",
        highlights: ["Bank Grade", "Encrypted", "Private"],
        mockupType: "security"
    }
]

export function PlatformSection() {
    const [activeTab, setActiveTab] = useState(FEATURES[0].id)
    const activeData = FEATURES.find(f => f.id === activeTab)!

    return (
        <section id="platform" className="py-12 md:py-20 px-6 bg-zinc-950 text-white relative overflow-hidden">
            {/* Architectural Grid Background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:40px_40px]" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-8">
                    <AdvancedScrollReveal variant="slideRight">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 uppercase text-[9px] font-black tracking-widest text-emerald-400">
                                <Cpu size={12} className="animate-pulse" /> Advanced Technology
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-none uppercase italic">
                                KhataPlus <span className="text-emerald-400">Engine.</span>
                            </h2>
                        </div>
                    </AdvancedScrollReveal>
                    <p className="text-zinc-500 text-sm font-medium max-w-xs leading-relaxed hidden md:block">
                        Grow your business with the most advanced billing features in India.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch">
                    {/* Compact controls */}
                    <div className="w-full lg:w-[280px] flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide">
                        {FEATURES.map((feature) => (
                            <button
                                key={feature.id}
                                onClick={() => setActiveTab(feature.id)}
                                className={cn(
                                    "p-4 md:p-5 rounded-2xl text-left transition-all duration-500 border relative group shrink-0 w-[180px] lg:w-full",
                                    activeTab === feature.id
                                        ? "bg-white border-white shadow-lg z-10"
                                        : "bg-white/5 border-white/5 hover:bg-white/10"
                                )}
                            >
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 shadow-lg",
                                        activeTab === feature.id ? "bg-zinc-100 " + feature.color : "bg-white/5 text-zinc-600"
                                    )}>
                                        <feature.icon size={20} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <div className={cn(
                                            "font-black tracking-tighter text-base italic uppercase",
                                            activeTab === feature.id ? "text-zinc-950" : "text-zinc-400"
                                        )}>
                                            {feature.title}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Simulation Engine Area - Filling the void */}
                    <div className="flex-1 w-full relative">
                        <AdvancedScrollReveal key={activeTab} variant="scaleUp">
                            <div className="bg-zinc-900 border border-white/10 rounded-[2.5rem] p-6 lg:p-0 relative overflow-hidden h-full flex flex-col lg:flex-row shadow-2xl min-h-[400px]">
                                {/* Left Side: Feature Detail */}
                                <div className="p-8 lg:p-12 flex-1 flex flex-col justify-center space-y-6 lg:border-r lg:border-white/5">
                                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl ring-2 ring-white/5", activeData.bg, activeData.color)}>
                                        <activeData.icon size={28} />
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-4xl lg:text-5xl font-black tracking-tighter italic text-white leading-none uppercase">
                                            {activeData.title}
                                        </h3>
                                        <p className="text-zinc-400 text-lg font-medium leading-relaxed max-w-sm">
                                            {activeData.description}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {activeData.highlights.map((h, i) => (
                                            <div key={i} className="flex flex-col gap-1.5 p-3 rounded-xl bg-white/5 border border-white/5">
                                                <div className={cn("h-1 w-6 rounded-full", activeData.bg.replace("bg-", "bg-opacity-100 bg-"))} />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{h}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Right Side: Visual Center / Logs Feed */}
                                <div className="bg-black/40 flex-1 relative flex flex-col overflow-hidden">
                                    {/* Terminal Header */}
                                    <div className="h-8 bg-black/60 flex items-center justify-between px-6 border-b border-white/5 backdrop-blur-md">
                                        <div className="flex gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                                        </div>
                                        <div className="text-[8px] font-black uppercase tracking-widest text-zinc-600">Sync Engine Console</div>
                                    </div>

                                    <div className="flex-1 flex flex-col items-center justify-center relative p-8">
                                        {/* The Mockup */}
                                        <div className="relative z-10 scale-90 md:scale-100">
                                            {activeTab === 'offline' && <OfflineMockup />}
                                            {activeTab === 'gst' && <GstMockup />}
                                            {activeTab === 'analytics' && <AnalyticsMockup />}
                                            {activeTab === 'security' && <SecurityMockup />}
                                        </div>

                                        {/* Background Logs (Filling the space) */}
                                        <div className="absolute inset-0 p-6 flex flex-col gap-2 font-mono text-[8px] opacity-10 pointer-events-none overflow-hidden text-emerald-500">
                                            <div className="flex items-center gap-2"><Check size={8} /> TCP/IP Handshake secure</div>
                                            <div className="flex items-center gap-2"><Check size={8} /> AES-256 Key rotation successful</div>
                                            <div className="flex items-center gap-2"><Check size={8} /> Buffer flush: 1.2MB optimized</div>
                                            <div className="flex items-center gap-2 animate-pulse"><Terminal size={8} /> Listening for delta packets...</div>
                                            {[...Array(15)].map((_, i) => (
                                                <div key={i} className="opacity-50">SYNC_PACKET_ID_{Math.random().toString(36).substring(7).toUpperCase()} :: STATUS_OK</div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Bottom Status Bar */}
                                    <div className="h-10 bg-black/60 border-t border-white/5 px-6 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[7px] font-black uppercase text-emerald-500/80 tracking-widest">Engine Online</span>
                                        </div>
                                        <div className="text-[7px] font-bold text-zinc-600 uppercase tracking-widest">Latency: 0.2ms</div>
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

function OfflineMockup() {
    return (
        <div className="flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in duration-700">
            <div className="relative">
                <Globe size={120} className="text-zinc-800 opacity-20" />
                <div className="absolute inset-0 flex items-center justify-center text-emerald-500">
                    <WifiOff size={48} className="animate-pulse" />
                </div>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest text-center">
                    Local Persistent Ledger
                </div>
            </div>
        </div>
    )
}

function GstMockup() {
    return (
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl w-[280px] shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-10 h-48 flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <div className="text-[8px] font-black text-blue-500 uppercase">GST INVOICE</div>
                    <div className="text-lg font-black italic tracking-tighter text-white">#KP-9021-02</div>
                </div>
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><FileText size={18} /></div>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-zinc-500"><div className="h-2 w-24 bg-zinc-800 rounded" /><div className="h-2 w-10 bg-zinc-800 rounded" /></div>
                <div className="flex justify-between text-[10px] text-zinc-500"><div className="h-2 w-16 bg-zinc-800 rounded" /><div className="h-2 w-12 bg-zinc-800 rounded" /></div>
            </div>
            <div className="pt-2 border-t border-white/5 text-blue-400 font-black italic text-xl text-right">
                ₹14,203.00
            </div>
        </div>
    )
}

function AnalyticsMockup() {
    return (
        <div className="flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in duration-700">
            <div className="flex gap-2 items-end h-28 w-[220px]">
                {[30, 60, 45, 90, 65, 85, 40, 95].map((h, i) => (
                    <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg transition-all duration-1000 origin-bottom"
                        style={{ height: `${h}%`, transitionDelay: `${i * 50}ms` }}
                    />
                ))}
            </div>
            <div className="grid grid-cols-2 gap-3 w-[220px]">
                <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20">
                    <div className="text-[8px] font-bold text-indigo-400 uppercase mb-0.5">Turnover</div>
                    <div className="text-base font-black italic text-white">+14%</div>
                </div>
                <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20">
                    <div className="text-[8px] font-bold text-indigo-400 uppercase mb-0.5">LTV</div>
                    <div className="text-base font-black italic text-white">₹8.4k</div>
                </div>
            </div>
        </div>
    )
}

function SecurityMockup() {
    return (
        <div className="relative w-32 h-44 bg-zinc-800 border-2 border-white/10 rounded-2xl flex flex-col items-center justify-start pt-8 gap-6 shadow-2xl animate-in fade-in slide-in-from-top-10">
            <div className="absolute inset-0 bg-rose-500/5 blur-2xl" />
            <div className="w-12 h-12 rounded-full bg-rose-500 flex items-center justify-center shadow-lg relative z-10">
                <Lock size={24} className="text-white" />
            </div>
            <div className="space-y-2 px-4 w-full relative z-10">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-1 w-full bg-white/5 rounded-full" />
                ))}
            </div>
            <div className="text-[8px] font-black text-rose-500 uppercase tracking-widest relative z-10">Vault Locked</div>
        </div>
    )
}
