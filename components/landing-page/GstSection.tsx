"use client"

import { FileText, Check, Smartphone, ArrowRight, Download, Send } from "lucide-react"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { cn } from "@/lib/utils"

export function GstSection() {
    return (
        <section id="gst" className="py-24 md:py-40 px-6 bg-white text-zinc-900 overflow-hidden relative">
            {/* Background Grid Accent - Light Mode */}
            <div className="absolute inset-0 z-0 opacity-[0.25] pointer-events-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] bg-[length:32px_32px]" />
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#10b98105,transparent_50%)]" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-20">
                    <div className="w-full lg:w-1/2 space-y-12">
                        <AdvancedScrollReveal variant="slideRight">
                            <div className="space-y-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
                                    <FileText size={14} />
                                    Tax Compliance
                                </div>
                                <h2 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] text-zinc-900">
                                    GST Billing <br />
                                    <span className="text-emerald-500 italic">Redefined.</span>
                                </h2>
                                <p className="text-zinc-500 text-xl font-light leading-relaxed max-w-xl">
                                    Generate tax-compliant invoices in under 5 seconds. Professional, fast, and 100% legal. No more manual calculations or rounding errors.
                                </p>
                            </div>
                        </AdvancedScrollReveal>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {[
                                "Unlimited GST Invoices",
                                "Auto-HSN / SAC Logic",
                                "GSTR-1 Data Export",
                                "E-Way Bill Support"
                            ].map((item, i) => (
                                <AdvancedScrollReveal key={i} variant="slideUp" delay={200 + (i * 100)}>
                                    <div className="flex items-center gap-4 group cursor-default p-4 rounded-2xl hover:bg-emerald-50/50 transition-colors border border-transparent hover:border-emerald-100">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                            <Check size={14} className="group-hover:scale-125 transition-transform" />
                                        </div>
                                        <span className="text-zinc-700 font-bold tracking-tight text-sm">{item}</span>
                                    </div>
                                </AdvancedScrollReveal>
                            ))}
                        </div>
                    </div>

                    <div className="w-full lg:w-1/2">
                        <AdvancedScrollReveal variant="scaleUp">
                            <div className="relative group">
                                {/* Mockup Glow - Emerald Aura */}
                                <div className="absolute -inset-10 bg-emerald-500/10 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                                <div className="relative bg-white text-zinc-950 rounded-[3rem] p-10 md:p-14 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-zinc-100 transform lg:rotate-2 hover:rotate-0 transition-all duration-700 overflow-hidden">
                                    {/* Invoice Overlay Elements */}
                                    <div className="absolute top-0 right-0 p-8">
                                        <div className="text-4xl font-black italic tracking-tighter text-emerald-500 underline decoration-4 decoration-emerald-100 underline-offset-8">KP</div>
                                    </div>

                                    <div className="space-y-10 relative z-10 text-left">
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Invoice Number</div>
                                            <div className="text-2xl font-black italic tracking-tighter text-zinc-900">#TXN-2026-8802</div>
                                        </div>

                                        <div className="space-y-4">
                                            <InvoiceLine label="Samsung Galaxy S24" amount="₹74,999.00" qty="1" />
                                            <InvoiceLine label="Custom Protection Case" amount="₹1,250.00" qty="2" />
                                            <div className="h-px bg-zinc-100 w-full my-6" />
                                            <div className="flex justify-between items-end">
                                                <div className="text-left">
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total + GST (18%)</div>
                                                    <div className="text-4xl font-black italic tracking-tighter text-emerald-500 leading-none mt-1">₹91,443.82</div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all cursor-pointer">
                                                        <Download size={20} />
                                                    </div>
                                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-[0_8px_16px_rgba(16,185,129,0.3)] hover:scale-110 transition-all cursor-pointer">
                                                        <Send size={20} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-500">
                                                <Smartphone size={18} />
                                            </div>
                                            <div className="text-[11px] font-bold text-emerald-800 leading-tight">Shared with customer via WhatsApp instantly. <br /><span className="text-emerald-600/60 font-medium tracking-tight whitespace-nowrap">Encryption Active (E2EE)</span></div>
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
