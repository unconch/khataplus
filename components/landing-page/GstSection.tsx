"use client"

import { FileText, Check, Smartphone } from "lucide-react"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"

export function GstSection() {
    return (
        <section id="gst" className="py-24 md:py-32 px-6 bg-emerald-900 text-white overflow-hidden relative">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 86c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm66 3c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm-46-45c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`
            }} />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-16">
                    <div className="w-full md:w-1/2">
                        <AdvancedScrollReveal variant="slideRight">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-emerald-200 text-sm font-semibold mb-6">
                                <FileText size={16} />
                                GST Ready
                            </div>
                            <h2 className="text-3xl md:text-5xl font-bold mb-6">Tax compliance made easy.</h2>
                            <p className="text-emerald-100/80 text-xl mb-8 leading-relaxed">
                                Generate GST-compliant tax invoices in seconds. Basic billing is <span className="text-white font-bold">unlimited in our Base Plan</span>, while automated reporting is available in our GST Suite.
                            </p>
                            <div className="space-y-4">
                                {[
                                    "Unlimited GST-compliant tax invoices",
                                    "One-tap GSTR-1 & 3B generation (Suite)",
                                    "HSN/SAC code lookup & tracking (Suite)",
                                    "Professional PDF templates & WhatsApp sharing"
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/30 flex items-center justify-center border border-emerald-400/50">
                                            <Check size={12} className="text-emerald-300" />
                                        </div>
                                        <span className="text-emerald-50">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </AdvancedScrollReveal>
                    </div>
                    <div className="w-full md:w-1/2">
                        <AdvancedScrollReveal variant="scaleUp">
                            <div className="relative bg-white text-zinc-900 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] transform rotate-2 hover:rotate-0 transition-transform duration-500">
                                <div className="flex justify-between border-b pb-4 mb-4">
                                    <div>
                                        <div className="text-xs uppercase text-zinc-400 font-bold tracking-widest">Tax Invoice</div>
                                        <div className="font-bold">INV-2026-001</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-emerald-600">KhataPlus</div>
                                    </div>
                                </div>
                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">Subtotal</span>
                                        <span className="font-medium">₹12,450.00</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">GST (18%)</span>
                                        <span className="font-medium">₹2,241.00</span>
                                    </div>
                                    <div className="flex justify-between border-t border-dashed pt-3">
                                        <span className="font-bold">Total Amount</span>
                                        <span className="font-bold text-emerald-600">₹14,691.00</span>
                                    </div>
                                </div>
                                <div className="w-full h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-sm gap-2">
                                    <Smartphone size={16} /> Share via WhatsApp
                                </div>
                            </div>
                        </AdvancedScrollReveal>
                    </div>
                </div>
            </div>
        </section>
    )
}
