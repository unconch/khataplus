"use client"

import { useState } from "react"
import { Plus, Minus, HelpCircle } from "lucide-react"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"

const faqs = [
    {
        question: "Can I access my data from multiple devices?",
        answer: "Yes! KhataPlus is built on a modern cloud architecture. You can log in from your computer, tablet, or phone simultaneously. All your sales, stock, and ledger data stays synced in real-time across every device."
    },
    {
        question: "What happens to my data if I decide to leave?",
        answer: "We believe in zero vendor lock-in. You can export all your data (customers, inventory, sales) into standard Excel or CSV files with just one click at any time. Your data is always yours to keep."
    },
    {
        question: "Does KhataPlus calculate GST automatically?",
        answer: "Absolutely. Our smart billing engine automatically calculates CGST, SGST, and IGST based on your product settings. It even generates HSN-compliant invoices to keep your business tax-ready."
    },
    {
        question: "Is there a limit to how many transactions I can record?",
        answer: "No. The KhataPlus Pioneer Plan allows you to record unlimited sales, expenses, and customer transactions. Our database is optimized for high-volume retailers who process hundreds of bills every day."
    },
    {
        question: "How does the automated backup system work?",
        answer: "Your data is backed up automatically every few minutes to secure cloud servers. Even if you lose your phone or your computer crashes, your business records are safe and can be restored instantly on a new device."
    },
    {
        question: "Can I manage multiple businesses under one account?",
        answer: "Yes, you can create and manage multiple organization profiles easily. Switch between different shops or business units from the dashboard with zero hassle, all while keeping their accounts completely separate."
    }
]

export function FaqSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    return (
        <section id="faq" className="py-24 md:py-32 px-6 bg-slate-50/30">
            <div className="max-w-4xl mx-auto">
                <AdvancedScrollReveal variant="slideUp">
                    <div className="text-center mb-20">
                        <h2 className="text-5xl md:text-7xl font-black tracking-tight text-zinc-900 mb-8 items-center justify-center flex flex-wrap gap-x-4">
                            Common <span className="text-emerald-600">Queries.</span>
                        </h2>
                        <p className="text-zinc-500 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
                            Everything you need to know about KhataPlus and how it helps your business grow.
                        </p>
                    </div>

                    <div className="space-y-6">
                        {faqs.map((faq, i) => (
                            <div
                                key={i}
                                className={`rounded-[2.5rem] border border-zinc-100 bg-white transition-all duration-300 shadow-sm hover:shadow-md ${openIndex === i ? "ring-2 ring-emerald-500/10 border-emerald-500/20" : ""
                                    }`}
                            >
                                <button
                                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                    className="w-full px-10 py-8 flex items-center justify-between text-left"
                                >
                                    <span className="text-xl md:text-2xl font-bold text-zinc-900 pr-8">
                                        {faq.question}
                                    </span>
                                    <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${openIndex === i ? "bg-emerald-500 text-white rotate-0 shadow-lg shadow-emerald-500/20" : "bg-zinc-100 text-zinc-400 rotate-90"}`}>
                                        {openIndex === i ? <Minus size={20} /> : <Plus size={20} />}
                                    </div>
                                </button>
                                <div className={`grid transition-all duration-300 ease-in-out ${openIndex === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                                    <div className="overflow-hidden">
                                        <div className="px-10 pb-10 text-zinc-600 text-lg md:text-xl leading-relaxed font-medium">
                                            {faq.answer}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </AdvancedScrollReveal>
            </div>
        </section>
    )
}
