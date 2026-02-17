"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Monitor, Smartphone, Receipt, Package, Users, BarChart3, Sparkles, Wallet } from "lucide-react"

export function AdaptiveInterfaceSection() {
    const [activeTab, setActiveTab] = useState<"desktop" | "pwa">("desktop")

    return (
        <section className="py-24 md:py-32 px-6 bg-zinc-900 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-5" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} />

            <div className="container mx-auto relative z-10">
                <div className="text-center mb-16">
                    <span className="text-emerald-400 font-semibold text-sm tracking-wider uppercase bg-emerald-500/10 px-3 py-1 rounded-full">Adaptive Interface</span>
                    <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-6">Experience Flexibility</h2>
                    <div className="flex items-center justify-center gap-4">
                        <button
                            onClick={() => setActiveTab("desktop")}
                            className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 ${activeTab === "desktop" ? "bg-white text-black shadow-lg scale-105" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
                        >
                            <Monitor className="w-5 h-5" /> Desktop UI
                        </button>
                        <button
                            onClick={() => setActiveTab("pwa")}
                            className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 ${activeTab === "pwa" ? "bg-white text-black shadow-lg scale-105" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
                        >
                            <Smartphone className="w-5 h-5" /> PWA Mobile
                        </button>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto">
                    <div className={`relative transition-all duration-500 ease-in-out ${activeTab === 'desktop' ? 'h-[600px] md:h-auto md:aspect-[16/9]' : 'h-[750px] md:h-[850px] md:aspect-[16/9]'} rounded-3xl border border-white/10 p-1 md:p-4 backdrop-blur-2xl bg-gradient-to-br from-white/5 to-white/0`}>
                        <div className="relative h-full w-full rounded-2xl overflow-hidden bg-[#0F0F0F] flex items-center justify-center">
                            <AnimatePresence mode="wait">
                                {activeTab === "desktop" ? (
                                    <motion.div
                                        key="desktop"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.4 }}
                                        className="w-full h-full flex"
                                    >
                                        {/* Desktop Mockup */}
                                        <div className="w-72 h-full border-r border-white/10 bg-white/5 flex flex-col p-6 gap-6 hidden md:flex">
                                            <div className="w-40 h-10 bg-white/10 rounded-md animate-pulse" />
                                            <div className="space-y-4 mt-4">
                                                {[1, 2, 3, 4, 5, 6].map(i => (
                                                    <div key={i} className="w-full h-12 bg-white/5 rounded-xl flex items-center px-4 gap-3">
                                                        <div className="w-5 h-5 rounded bg-white/10" />
                                                        <div className="flex-1 h-3 bg-white/10 rounded" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex-1 p-4 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 overflow-y-auto md:overflow-hidden">
                                            <div className="md:col-span-2 space-y-6 md:space-y-8">
                                                <div className="h-24 bg-white/5 rounded-2xl border border-white/10 p-6 flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20" />
                                                    <div className="space-y-2">
                                                        <div className="w-32 h-4 bg-white/10 rounded" />
                                                        <div className="w-48 h-3 bg-white/5 rounded" />
                                                    </div>
                                                </div>
                                                <div className="h-[300px] md:h-[400px] bg-white/5 rounded-2xl border border-white/10 p-6 relative overflow-hidden group">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-50" />
                                                    <div className="relative z-10 h-full flex flex-col">
                                                        <div className="w-1/3 h-6 bg-white/10 rounded mb-8" />
                                                        <div className="flex-1 w-full bg-gradient-to-t from-emerald-500/20 to-transparent rounded-xl border border-white/5 mt-auto" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="md:col-span-1 space-y-6">
                                                <div className="h-48 bg-white/5 rounded-2xl border border-white/10 p-6">
                                                    <div className="w-1/2 h-4 bg-white/10 rounded mb-4" />
                                                    <div className="space-y-3">
                                                        {[1, 2, 3].map(i => <div key={i} className="w-full h-8 bg-white/5 rounded-lg" />)}
                                                    </div>
                                                </div>
                                                <div className="h-48 bg-white/5 rounded-2xl border border-white/10 p-6">
                                                    <div className="w-1/2 h-4 bg-white/10 rounded mb-4" />
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-white/5 rounded-lg" />)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="pwa"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.4 }}
                                        className="w-full h-full flex flex-col items-center justify-center p-4 md:p-12"
                                    >
                                        <div className="w-[340px] h-[680px] border-[8px] border-zinc-800 rounded-[3.5rem] bg-black relative overflow-hidden shadow-2xl scale-95 sm:scale-100 md:scale-105 lg:scale-115 origin-center ring-1 ring-white/10 transition-transform duration-500">
                                            {/* Notch */}
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-8 bg-zinc-800 rounded-b-2xl z-20" />

                                            {/* Status Bar */}
                                            <div className="absolute top-2 right-5 z-20 flex gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                                                <div className="w-4 h-1.5 rounded-full bg-zinc-600" />
                                            </div>

                                            <div className="h-full w-full bg-[#09090b] flex flex-col relative text-white font-sans rounded-[2.6rem] overflow-hidden">
                                                {/* App Header */}
                                                <div className="pt-10 pb-4 px-5 flex items-center justify-between border-b border-white/5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold">K</div>
                                                        <div className="cursor-default">
                                                            <div className="h-2 w-20 bg-emerald-500/20 rounded mb-1" />
                                                            <div className="h-2 w-12 bg-white/20 rounded" />
                                                        </div>
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full bg-white/5" />
                                                </div>

                                                <div className="flex-1 p-5 space-y-6 overflow-hidden relative">
                                                    {/* Quick Actions Grid */}
                                                    <div>
                                                        <div className="h-3 w-24 bg-white/10 rounded mb-3" />
                                                        <div className="grid grid-cols-4 gap-3">
                                                            {[1, 2, 3, 4].map(i => (
                                                                <div key={i} className="flex flex-col items-center gap-2">
                                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${i === 1 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/5 text-zinc-500'}`}>
                                                                        {i === 1 && <Receipt size={20} />}
                                                                        {i === 2 && <Package size={20} />}
                                                                        {i === 3 && <Users size={20} />}
                                                                        {i === 4 && <BarChart3 size={20} />}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Hero Card */}
                                                    <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 p-4 opacity-20"><Sparkles size={60} /></div>
                                                        <div className="relative z-10">
                                                            <div className="h-3 w-20 bg-white/40 rounded mb-2" />
                                                            <div className="h-8 w-32 bg-white rounded mb-2" />
                                                            <div className="h-3 w-16 bg-emerald-200/50 rounded" />
                                                        </div>
                                                    </div>

                                                    {/* Recent List */}
                                                    <div className="space-y-3">
                                                        <div className="h-3 w-24 bg-white/10 rounded" />
                                                        {[1, 2].map(i => (
                                                            <div key={i} className="bg-white/5 rounded-xl p-3 flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-full bg-white/10" />
                                                                    <div className="space-y-1">
                                                                        <div className="h-2 w-20 bg-white/20 rounded" />
                                                                        <div className="h-2 w-12 bg-white/10 rounded" />
                                                                    </div>
                                                                </div>
                                                                <div className="h-3 w-10 bg-emerald-500/30 rounded" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Bottom Tab Bar */}
                                                <div className="h-16 bg-[#09090b]/90 backdrop-blur-md border-t border-white/10 flex items-center justify-around px-2 rounded-b-[2.5rem]">
                                                    <div className="flex flex-col items-center gap-1 text-emerald-500">
                                                        <Monitor size={20} />
                                                    </div>
                                                    <div className="flex flex-col items-center gap-1 text-zinc-600">
                                                        <Receipt size={20} />
                                                    </div>
                                                    <div className="w-12 h-12 -mt-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 text-white">
                                                        <span className="text-xl font-bold">+</span>
                                                    </div>
                                                    <div className="flex flex-col items-center gap-1 text-zinc-600">
                                                        <Users size={20} />
                                                    </div>
                                                    <div className="flex flex-col items-center gap-1 text-zinc-600">
                                                        <Wallet size={20} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="mt-8 grid md:grid-cols-2 gap-8">
                        <div className={`p-6 rounded-2xl border border-white/10 transition-all duration-300 ${activeTab === 'desktop' ? 'bg-white/10 block' : 'bg-transparent opacity-50 hidden md:block'}`}>
                            <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><Monitor className="w-5 h-5 text-emerald-400" /> Desktop Power</h3>
                            <p className="text-gray-400">Full-featured dashboard with multi-pane layouts, deep analytics, and administrative controls optimized for productivity on large screens.</p>
                        </div>
                        <div className={`p-6 rounded-2xl border border-white/10 transition-all duration-300 ${activeTab === 'pwa' ? 'bg-white/10 block' : 'bg-transparent opacity-50 hidden md:block'}`}>
                            <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><Smartphone className="w-5 h-5 text-teal-400" /> Mobile Agility</h3>
                            <p className="text-gray-400">Installable PWA that feels like a native app. Optimized touch interactions, offline capabilities, and focused views for field work.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
