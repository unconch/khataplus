"use client"

import { FileText, Check, Smartphone, ArrowRight, Download, Send } from "lucide-react"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { cn } from "@/lib/utils"

export function GstSection() {
    return (
        <section id="gst" className="py-24 md:py-40 px-6 bg-zinc-950 text-white overflow-hidden relative">
            {/* Background Grid Accent */}
            <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none bg-[linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] bg-[length:60px_60px]" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-20">
                    <div className="w-full lg:w-1/2 space-y-12">
                        <AdvancedScrollReveal variant="slideRight">
                            <div className="space-y-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                    <FileText size={14} />
                                    Tax Compliance
                                </div>
                                <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.95]">
                                    GST Billing <br />
                                    <span className="text-emerald-400 italic">Redefined.</span>
                                </h2>
                                <p className="text-zinc-400 text-xl font-medium leading-relaxed max-w-xl">
                                    Generate tax-compliant invoices in under 5 seconds. Professional, fast, and 100% legal. No more manual calculations or rounding errors.
                                </p>
                            </div>
                        </AdvancedScrollReveal>

                        <div className="space-y-6">
                            {[
                                "Unlimited GST-Compliant Tax Invoices",
                                "Auto-HSN / SAC Code Logic",
                                "One-Tap GSTR-1 Data Export",
                                "E-Way Bill Generation Support"
                            ].map((item, i) => (
                                <AdvancedScrollReveal key={i} variant="slideUp" delay={200 + (i * 100)}>
                                    <div className="flex items-center gap-4 group cursor-default">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/40 transition-colors">
                                            <Check size={12} className="text-emerald-400" />
                                        </div>
                                        <span className="text-zinc-300 font-bold tracking-tight text-lg">{item}</span>
                                    </div>
                                </AdvancedScrollReveal>
                            ))}
                        </div>
                    </div>

                    <div className="w-full lg:w-1/2">
                        <AdvancedScrollReveal variant="scaleUp">
                            <div className="relative group">
                                {/* Mockup Glow */}
                                <div className="absolute -inset-10 bg-emerald-500/20 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                                <div className="relative bg-white text-zinc-950 rounded-[3rem] p-10 md:p-14 shadow-2xl transform lg:rotate-2 hover:rotate-0 transition-all duration-700 overflow-hidden">
                                    {/* Invoice Overlay Elements */}
                                    <div className="absolute top-0 right-0 p-8">
                                        <div className="text-4xl font-black italic tracking-tighter text-emerald-600">KP</div>
                                    </div>

                                    <div className="space-y-10 relative z-10">
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Invoice Number</div>
                                            <div className="text-2xl font-black italic tracking-tighter">#TXN-2026-8802</div>
                                        </div>

                                        <div className="space-y-4">
                                            <InvoiceLine label="Samsung Galaxy S24" amount="₹74,999.00" qty="1" />
                                            <InvoiceLine label="Custom Protection Case" amount="₹1,250.00" qty="2" />
                                            <div className="h-px bg-zinc-100 w-full my-6" />
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total + GST (18%)</div>
                                                    <div className="text-4xl font-black italic tracking-tighter text-emerald-600 leading-none">₹91,443.82</div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <div className="w-10 h-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400">
                                                        <Download size={18} />
                                                    </div>
                                                    <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                                        <Send size={18} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                                                <Smartphone size={16} />
                                            </div>
                                            <div className="text-xs font-bold text-zinc-500">Shared with customer via WhatsApp instantly.</div>
                                        </div>
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

function InvoiceLine({ label, amount, qty }: { label: string, amount: string, qty: string }) {
    return (
        <div className="flex justify-between items-center group">
            <div className="space-y-0.5">
                <div className="font-bold text-zinc-900 leading-none">{label}</div>
                <div className="text-[10px] text-zinc-400 uppercase font-black tracking-widest">Qty: {qty}</div>
            </div>
            <div className="font-black text-right tracking-tight">{amount}</div>
        </div>
    )
}
