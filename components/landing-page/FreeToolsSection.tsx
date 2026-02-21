"use client"

import Link from "next/link"
import { Calculator, Tag, Sparkles, ArrowUpRight, Smartphone, Share2, MessageCircle } from "lucide-react"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { cn } from "@/lib/utils"

export function FreeToolsSection() {
    return (
        <section id="growth-tools" className="py-16 md:py-20 bg-white relative overflow-hidden">
            {/* Background Decorations - Subtle Grid */}
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] bg-[length:40px_40px]" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">

                    {/* Content Column */}
                    <div className="flex-1 space-y-8">
                        <AdvancedScrollReveal variant="slideRight">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100/50">
                                    <Sparkles size={12} className="text-emerald-600" />
                                    <span className="text-emerald-600 font-black text-[9px] tracking-widest uppercase">Growth Engine</span>
                                </div>
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-zinc-900 leading-[0.95] uppercase italic">
                                    Grow your daily <br />
                                    <span className="text-zinc-400">reach & profits.</span>
                                </h2>
                                <p className="text-zinc-500 text-base font-medium leading-relaxed max-w-md">
                                    Scale your business operations with free digital tools built for every modern retailer.
                                </p>
                            </div>
                        </AdvancedScrollReveal>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <ToolCard
                                href="/tools/gst-calculator"
                                icon={Calculator}
                                title="GST Intelligence"
                                description="Calculate tax and HSN codes."
                                color="emerald"
                            />
                            <ToolCard
                                href="/tools/business-card"
                                icon={Tag}
                                title="Card Designer"
                                description="Create digital visiting cards."
                                color="blue"
                            />
                            <div className="sm:col-span-2">
                                <ToolCard
                                    href="#whatsapp"
                                    icon={MessageCircle}
                                    title="WhatsApp Marketing"
                                    description="Broadcast promotions & reminders with one tap."
                                    color="green"
                                    isComingSoon
                                />
                            </div>
                        </div>
                    </div>

                    {/* Visual Mockup Column */}
                    <div className="flex-1 w-full lg:w-auto">
                        <AdvancedScrollReveal variant="scaleUp">
                            <div className="relative">
                                <div className="relative bg-zinc-950 rounded-[2.5rem] p-1 border border-white/10 shadow-2xl overflow-hidden group">
                                    <div className="bg-zinc-900 rounded-[2.2rem] p-8 md:p-10 overflow-hidden relative">
                                        <div className="space-y-8 relative z-10">
                                            <div className="space-y-2">
                                                <div className="h-1 w-10 bg-emerald-500 rounded-full mb-4" />
                                                <h3 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter leading-none uppercase">
                                                    10x your <br />
                                                    <span className="text-emerald-400">customer reach.</span>
                                                </h3>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5 group-hover:bg-white/10 transition-colors">
                                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                                        <Share2 size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-black text-sm uppercase tracking-tight">Auto-Sharing</div>
                                                        <div className="text-zinc-500 text-[10px] font-bold">Instant WhatsApp distribution</div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5 group-hover:bg-white/10 transition-colors">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                                                        <Smartphone size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-black text-sm uppercase tracking-tight">Shop QR Code</div>
                                                        <div className="text-zinc-500 text-[10px] font-bold">Your custom storefront QR</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <button className="w-full py-4 rounded-2xl bg-emerald-500 text-zinc-950 font-black uppercase tracking-widest text-[10px] hover:bg-emerald-400 transition-all shadow-xl">
                                                Get Your Free Kit
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Badge - Compact */}
                                <div className="absolute -bottom-4 -right-4 bg-white p-4 rounded-2xl shadow-2xl border border-zinc-100 hidden md:block">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                                            <Sparkles size={16} />
                                        </div>
                                        <div>
                                            <div className="text-[8px] text-zinc-400 font-black uppercase tracking-widest">New Growth</div>
                                            <div className="text-sm font-black text-zinc-900">+1,420 Today</div>
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

function ToolCard({ href, icon: Icon, title, description, color, isNew, isComingSoon }: { href: string, icon: any, title: string, description: string, color: "emerald" | "blue" | "green", isNew?: boolean, isComingSoon?: boolean }) {
    const colorStyles = {
        emerald: "group-hover:text-emerald-600 bg-emerald-50 border-emerald-500/10",
        blue: "group-hover:text-blue-600 bg-blue-50 border-blue-500/10",
        green: "group-hover:text-green-600 bg-green-50 border-green-500/10"
    }

    return (
        <div className={cn(
            "group p-6 rounded-[2rem] bg-zinc-50/50 border border-zinc-100 transition-all duration-500 relative overflow-hidden flex flex-col justify-between h-full",
            isComingSoon ? "cursor-not-allowed opacity-80" : "hover:bg-white hover:border-zinc-200 hover:shadow-xl cursor-pointer"
        )}>
            {isComingSoon ? (
                <div className="h-full flex flex-col justify-between">
                    <div>
                        <div className={cn("w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm", colorStyles[color])}>
                            <Icon size={20} />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-black italic tracking-tight text-zinc-900 uppercase leading-none">{title}</h3>
                                <span className="text-[7px] font-black uppercase px-2 py-0.5 bg-zinc-950 text-white rounded-full">Coming Soon</span>
                            </div>
                            <p className="text-zinc-500 text-[11px] font-medium leading-relaxed max-w-[180px]">{description}</p>
                        </div>
                    </div>
                </div>
            ) : (
                <Link href={href} className="h-full flex flex-col justify-between">
                    <div>
                        <div className={cn("w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-all", colorStyles[color])}>
                            <Icon size={20} />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-black italic tracking-tight text-zinc-900 uppercase leading-none">{title}</h3>
                                {isNew && <span className="text-[7px] font-black uppercase px-2 py-0.5 bg-emerald-500 text-white rounded-full">New</span>}
                            </div>
                            <p className="text-zinc-500 text-[11px] font-medium leading-relaxed max-w-[180px]">{description}</p>
                        </div>
                    </div>
                </Link>
            )}
        </div>
    )
}

