"use client"

import { WifiOff, TrendingUp, ShieldCheck, FileText, Zap, Globe } from "lucide-react"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"

const INDUSTRIES = [
    "RETAIL", "WHOLESALE", "PHARMACY", "TEXTILES", "ELECTRONICS",
    "FMCG", "HARDWARE", "DISTRIBUTION", "SERVICES", "MANUFACTURING"
]
const INDUSTRY_LOOP = [...INDUSTRIES, ...INDUSTRIES, ...INDUSTRIES]

export function FeaturesSection() {
    return (
        <section id="features" className="py-20 md:py-28 px-6 bg-transparent relative overflow-hidden text-zinc-900">
            {/* Massive Parallax Ambient Background Glows - Faded Boundary */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
                style={{ maskImage: "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)" }}
            >
                <div className="absolute top-0 left-1/4 w-[800px] h-[600px] bg-gradient-radial from-fuchsia-400/20 to-transparent opacity-60 rounded-full mix-blend-multiply float-slow" />
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[500px] bg-gradient-radial from-orange-400/20 to-transparent opacity-60 rounded-full mix-blend-multiply float-slow" />
                <div className="absolute top-1/2 left-1/2 w-[1000px] h-[400px] bg-gradient-radial from-blue-400/20 to-transparent opacity-60 rounded-full -translate-x-1/2 -translate-y-1/2 mix-blend-multiply float-slow" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <AdvancedScrollReveal variant="slideUp">
                    <div className="mb-16 mt-8 flex flex-col md:flex-row md:items-end justify-between gap-12">
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 border border-zinc-200/50 backdrop-blur-md mb-8 shadow-sm">
                                <Zap size={14} className="text-orange-500" />
                                <span className="text-zinc-600 font-bold text-[11px] tracking-[0.2em] uppercase">Core Capabilities</span>
                            </div>
                            <div className="mb-8 overflow-hidden">
                                <div className="flex gap-6 items-center pr-6 w-max whitespace-nowrap ticker-scroll">
                                    {INDUSTRY_LOOP.map((word, i) => (
                                        <div key={`${word}-${i}`} className="flex items-center gap-6">
                                            <span className="text-sm md:text-base font-black uppercase tracking-[0.15em] text-zinc-500">
                                                {word}
                                            </span>
                                            <span className="text-zinc-300 text-sm">{"\u2726"}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <h2 className="text-5xl md:text-[5.5rem] font-bold tracking-tighter text-zinc-900 leading-[0.95] max-w-2xl">
                                Everything you need. <br className="hidden md:block" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-rose-500 to-fuchsia-600">Built for speed.</span>
                            </h2>
                        </div>
                        <p className="text-zinc-500 text-xl max-w-md font-light tracking-wide md:pb-6">
                            We've consolidated every shop management essential into one seamless, blazingly fast intelligence engine.
                        </p>
                    </div>
                </AdvancedScrollReveal>

                {/* Asymmetrical Parallax Feature Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">

                    {/* Left Column (Huge span, scrolls slower) */}
                    <div className="lg:col-span-7 space-y-6 md:space-y-8">
                        <FeatureCard
                            icon={WifiOff}
                            title="True Offline Synchronization"
                            desc="Keep billing even when internet is off. Your data is saved locally and syncs automatically when connection returns."
                            colorFrom="from-blue-500"
                            colorTo="to-cyan-400"
                            bgLight="bg-blue-50"
                            textColors="text-blue-600"
                            large
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                            <FeatureCard
                                icon={ShieldCheck}
                                title="Data Security"
                                desc="Your business data is encrypted and protected."
                                colorFrom="from-emerald-500"
                                colorTo="to-teal-400"
                                bgLight="bg-emerald-50"
                                textColors="text-emerald-600"
                            />
                            <FeatureCard
                                icon={Globe}
                                title="Supplier Management"
                                desc="Track suppliers, add purchases, and record payments in one place."
                                colorFrom="from-zinc-500"
                                colorTo="to-slate-400"
                                bgLight="bg-zinc-100"
                                textColors="text-zinc-600"
                            />
                        </div>
                    </div>

                    {/* Right Column (Standard span, scrolls faster for parallax overlap) */}
                    <div className="lg:col-span-5 space-y-6 md:space-y-8 lg:mt-20">
                        <FeatureCard
                            icon={TrendingUp}
                            title="Deep Intelligence Analytics"
                            desc="See sales trends, find slow-moving items, and spot your best-selling products at a glance."
                            colorFrom="from-rose-500"
                            colorTo="to-orange-400"
                            bgLight="bg-rose-50"
                            textColors="text-rose-600"
                            large
                        />
                        <FeatureCard
                            icon={FileText}
                            title="GST Billing"
                            desc="Create GST-ready invoices quickly and share them with customers."
                            colorFrom="from-fuchsia-500"
                            colorTo="to-purple-500"
                            bgLight="bg-fuchsia-50"
                            textColors="text-fuchsia-600"
                        />
                    </div>

                </div>
            </div>
        </section>
    )
}

function FeatureCard({ icon: Icon, title, desc, colorFrom, colorTo, bgLight, textColors, large }: any) {
    return (
        <AdvancedScrollReveal variant="scaleUp" className="group h-full relative">
            <div className={`relative z-10 ${large ? 'p-10 md:p-14 rounded-[3rem]' : 'p-8 md:p-10 rounded-[2.5rem]'} bg-white/85 border border-zinc-200/60 hover:border-zinc-300 transition-all duration-500 hover:bg-white h-full flex flex-col justify-start overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]`}>

                {/* Internal Subtle Glow instead of blur glow */}
                <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${colorFrom} ${colorTo} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-full translate-x-1/2 -translate-y-1/2 mix-blend-multiply`} />

                <div className={`w-14 h-14 rounded-2xl ${bgLight} border border-white/50 flex items-center justify-center shadow-sm mb-8 group-hover:scale-110 transition-transform duration-500 relative overflow-hidden`}>
                    <Icon size={24} strokeWidth={1.5} className={`${textColors} relative z-10`} />
                </div>

                <h3 className={`${large ? 'text-3xl lg:text-4xl' : 'text-2xl'} font-semibold text-zinc-900 tracking-tight mb-4 relative z-10 group-hover:text-black`}>{title}</h3>
                <p className={`text-zinc-500 leading-relaxed relative z-10 font-medium ${large ? 'text-lg' : 'text-base'}`}>{desc}</p>
            </div>
        </AdvancedScrollReveal>
    )
}
