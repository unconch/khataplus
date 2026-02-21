"use client"

import Link from "next/link"
import { Calculator, Tag } from "lucide-react"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"

export function FreeToolsSection() {
    return (
        <section className="pt-8 md:pt-10 pb-24 bg-white relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        <AdvancedScrollReveal variant="slideRight">
                            <div className="space-y-4">
                                <span className="text-emerald-600 font-bold text-xs tracking-widest uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Growth Tools</span>
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black italic tracking-tighter text-zinc-900 leading-tight">
                                    Free tools for <br />
                                    <span className="text-emerald-500">Every Business.</span>
                                </h2>
                                <p className="text-zinc-500 text-xl font-medium leading-relaxed max-w-lg">
                                    We believe in empowering local merchants. Use our professional tools for free, no account needed.
                                </p>
                            </div>
                        </AdvancedScrollReveal>

                        <div className="grid sm:grid-cols-2 gap-6">
                            <Link href="/tools/gst-calculator" className="group p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100 hover:border-emerald-500/50 hover:bg-white hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-transform">
                                    <Calculator className="text-emerald-600" />
                                </div>
                                <h3 className="text-xl font-black italic mb-2">GST Finder</h3>
                                <p className="text-zinc-500 text-sm font-medium">Find HSN codes and calculate taxes in seconds.</p>
                            </Link>
                            <Link href="/tools/business-card" className="group p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100 hover:border-emerald-500/50 hover:bg-white hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-transform">
                                    <Tag className="text-emerald-600" />
                                </div>
                                <h3 className="text-xl font-black italic mb-2">Card Maker</h3>
                                <p className="text-zinc-500 text-sm font-medium">Create professional visiting cards for your shop.</p>
                            </Link>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500/20 blur-[120px] rounded-full" />
                        <div className="relative bg-zinc-950/90 backdrop-blur-3xl rounded-[3rem] p-4 shadow-2xl overflow-hidden group border border-white/10">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-transparent to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                            <div className="relative border border-white/5 rounded-[2.5rem] overflow-hidden">
                                <img
                                    src="https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&q=80&w=1000"
                                    alt="Merchant using KhataPlus"
                                    className="w-full h-auto opacity-80 group-hover:scale-110 transition-transform duration-1000 grayscale group-hover:grayscale-0"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                                <div className="absolute bottom-10 left-10 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]" />
                                    </div>
                                    <p className="text-white text-3xl font-black tracking-tight leading-none italic">"KhataPlus changed how<br />I track credit."</p>
                                    <p className="text-emerald-400 text-xs font-black uppercase tracking-widest">— Rahul, New Market</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
