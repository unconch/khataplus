"use client"

import { useState } from "react"
import { Plus, Minus, HelpCircle, ArrowRight, MessageSquare } from "lucide-react"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { cn } from "@/lib/utils"

const faqs = [
    {
        question: "Can I access my data from multiple devices?",
        answer: "Yes! KhataPlus is built on a modern cloud architecture. All your sales, stock, and ledger data stays synced in real-time across every device."
    },
    {
        question: "What happens to my data if I decide to leave?",
        answer: "We believe in zero vendor lock-in. You can export all your data (customers, inventory, sales) into standard Excel or CSV files with just one click."
    },
    {
        question: "Does KhataPlus calculate GST automatically?",
        answer: "Absolutely. Our engine automatically calculates GST based on your settings and generates HSN-compliant invoices."
    },
    {
        question: "Is there a limit to transactions?",
        answer: "No. Our storage is optimized for high-volume retailers. Record thousands of transactions without any performance hit."
    },
    {
        question: "How does the backup system work?",
        answer: "Your data is backed up automatically to secure cloud servers using block-level sync. Your records are always safe."
    }
]

export function FaqSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(0)

    return (
        <section id="faq" className="py-16 md:py-20 px-6 bg-white relative overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
                    <div className="lg:w-1/3 lg:sticky lg:top-32 h-fit space-y-6">
                        <AdvancedScrollReveal variant="slideRight">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200/50">
                                    <HelpCircle size={12} className="text-zinc-600" />
                                    <span className="text-zinc-600 font-black text-[9px] tracking-widest uppercase">Support Center</span>
                                </div>
                                <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-zinc-900 leading-none uppercase italic">
                                    Common <br />
                                    <span className="text-zinc-400">Queries.</span>
                                </h2>
                                <p className="text-zinc-500 text-sm font-medium leading-relaxed max-w-sm">
                                    Got questions? We've got answers. If you can't find what you're looking for, our support team is ready.
                                </p>
                            </div>
                        </AdvancedScrollReveal>

                        <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100 space-y-3 shadow-sm">
                            <h4 className="text-lg font-black italic tracking-tighter text-emerald-900 uppercase">Need direct help?</h4>
                            <p className="text-emerald-700/70 text-[11px] font-medium leading-relaxed">Join our merchant community on WhatsApp for instant support and tips.</p>
                            <button className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest group">
                                Contact Support <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>

                    <div className="lg:w-2/3 space-y-3">
                        {faqs.map((faq, i) => (
                            <AdvancedScrollReveal key={i} variant="slideUp" delay={i * 50}>
                                <div
                                    className={cn(
                                        "group rounded-2xl border transition-all duration-500 overflow-hidden",
                                        openIndex === i
                                            ? "bg-zinc-950 border-zinc-900 shadow-xl"
                                            : "bg-zinc-50 border-zinc-100 hover:bg-zinc-100/50"
                                    )}
                                >
                                    <button
                                        onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                        className="w-full px-6 py-5 flex items-center justify-between text-left"
                                    >
                                        <span className={cn(
                                            "text-lg md:text-xl font-black italic tracking-tighter pr-8 uppercase",
                                            openIndex === i ? "text-white" : "text-zinc-900"
                                        )}>
                                            {faq.question}
                                        </span>
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500",
                                            openIndex === i
                                                ? "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/40"
                                                : "bg-white text-zinc-400 shadow-sm"
                                        )}>
                                            {openIndex === i ? <Minus size={16} /> : <Plus size={16} />}
                                        </div>
                                    </button>
                                    <div className={cn(
                                        "grid transition-all duration-500 ease-in-out",
                                        openIndex === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                                    )}>
                                        <div className="overflow-hidden">
                                            <div className={cn(
                                                "px-6 pb-6 text-sm font-medium leading-relaxed",
                                                openIndex === i ? "text-zinc-400" : "text-zinc-500"
                                            )}>
                                                {faq.answer}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </AdvancedScrollReveal>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
