"use client"

import Link from "next/link"
import { Calculator, Tag, MessageCircle, ArrowRight } from "lucide-react"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"

export function FreeToolsSection() {
    return (
        <section id="growth-tools" className="py-24 md:py-32 px-6 bg-transparent relative overflow-hidden">
            {/* Subtle Neon Backdrop - Light Mode */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-200/40 blur-[150px] rounded-full pointer-events-none mix-blend-multiply" />

            <div className="max-w-6xl mx-auto relative z-10 text-center">
                <AdvancedScrollReveal variant="slideUp">
                    <h2 className="text-4xl md:text-5xl font-semibold tracking-tighter text-zinc-900 mb-6">
                        More than just billing. <br className="hidden md:block" />
                        <span className="text-zinc-500">Tools to grow your business.</span>
                    </h2>
                    <p className="text-lg text-zinc-500 font-medium max-w-2xl mx-auto mb-16 tracking-wide">
                        Access our suite of free digital utilities designed to simplify daily operations and multiply your customer reach.
                    </p>
                </AdvancedScrollReveal>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                    <ToolCard
                        href="/tools/gst-calculator"
                        icon={Calculator}
                        title="GST Calculator"
                        desc="Instantly calculate SGST, CGST, and reverse calculations."
                        colorHover="hover:border-emerald-200"
                        glow="group-hover:bg-emerald-50/50"
                        iconGlow="text-emerald-600"
                        bgIcon="bg-emerald-50"
                    />
                    <ToolCard
                        href="/tools/business-card"
                        icon={Tag}
                        title="Digital Card Maker"
                        desc="Design and download beautiful visiting cards in seconds."
                        colorHover="hover:border-blue-200"
                        glow="group-hover:bg-blue-50/50"
                        iconGlow="text-blue-600"
                        bgIcon="bg-blue-50"
                    />
                    <ToolCard
                        href="/whatsapp"
                        icon={MessageCircle}
                        title="WhatsApp CRM"
                        desc="Bulk broadcast your daily offers directly to customers."
                        isComingSoon
                        colorHover=""
                        glow=""
                        iconGlow="text-zinc-400"
                        bgIcon="bg-zinc-100"
                    />
                </div>
            </div>
        </section>
    )
}

function ToolCard({ href, icon: Icon, title, desc, isComingSoon, colorHover, glow, iconGlow, bgIcon }: any) {
    if (isComingSoon) {
        return (
            <div className="relative p-10 rounded-3xl bg-zinc-50/50 border border-zinc-200 flex flex-col items-center text-center opacity-60">
                <div className="absolute top-6 right-6 px-3 py-1 bg-zinc-200 text-zinc-500 rounded-full text-[10px] uppercase font-bold tracking-[0.2em] border border-zinc-300">
                    Soon
                </div>
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-zinc-400 mb-8 border border-zinc-200 shadow-sm">
                    <Icon size={26} strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-semibold text-zinc-500 mb-3">{title}</h3>
                <p className="text-base text-zinc-400 font-medium">{desc}</p>
            </div>
        )
    }

    return (
        <AdvancedScrollReveal variant="scaleUp" className="h-full">
            <Link href={href} className="group block h-full">
                <div className={`p-10 rounded-3xl bg-white border border-zinc-200/80 ${colorHover} flex flex-col items-center text-center transition-all duration-500 h-full relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)]`}>

                    {/* Hover Glow Background */}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none ${glow} mix-blend-multiply`} />

                    <div className={`w-16 h-16 ${bgIcon} border border-zinc-100 rounded-2xl flex items-center justify-center shadow-sm mb-8 group-hover:scale-110 transition-transform duration-500 relative z-10 ${iconGlow}`}>
                        <Icon size={26} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-2xl font-semibold text-zinc-900 mb-3 group-hover:text-black transition-colors relative z-10">{title}</h3>
                    <p className="text-base text-zinc-500 font-medium mb-8 relative z-10">{desc}</p>
                    <div className={`mt-auto flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-x-4 group-hover:translate-x-0 relative z-10 ${iconGlow}`}>
                        Try Tool <ArrowRight size={16} />
                    </div>
                </div>
            </Link>
        </AdvancedScrollReveal>
    )
}
