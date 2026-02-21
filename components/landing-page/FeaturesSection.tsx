"use client"

import { WifiOff, TrendingUp, ShieldCheck, FileText, Smartphone, Zap, Clock, Globe } from "lucide-react"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { BentoGrid, BentoCard } from "@/components/bento-grid"
import { cn } from "@/lib/utils"

export function FeaturesSection() {
    return (
        <section id="features" className="py-24 md:py-32 px-6 bg-white relative">
            <div className="max-w-7xl mx-auto">
                <AdvancedScrollReveal variant="slideUp">
                    <div className="text-center mb-20 md:mb-28">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100/50 mb-6">
                            <Zap size={14} className="text-blue-600" />
                            <span className="text-blue-600 font-bold text-[10px] tracking-widest uppercase">Core Capabilities</span>
                        </div>
                        <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-zinc-900 leading-[0.9]">
                            Everything you need to <br />
                            <GradientText className="inline" colors={["#1d4ed8", "#3b82f6", "#60a5fa"]}>
                                Run at Light Speed.
                            </GradientText>
                        </h2>
                        <p className="text-zinc-500 text-xl max-w-2xl mx-auto mt-8 font-medium">
                            We've consolidated every shop management essential into one seamless interface.
                        </p>
                    </div>
                </AdvancedScrollReveal>

                <BentoGrid className="grid-rows-1 md:grid-rows-2">
                    <BentoCard
                        name="True Offline First"
                        className="md:col-span-2 md:row-span-1"
                        Icon={WifiOff}
                        description="No internet? No problem. Create entries, generate bills, and manage inventory anytime. Data syncs automatically when you're back."
                        href="/#offline"
                        cta="Explore Offline Tech"
                        background={
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] bg-[length:20px_20px]" />
                        }
                    />
                    <BentoCard
                        name="Smart Analytics"
                        className="md:col-span-1 md:row-span-2"
                        Icon={TrendingUp}
                        description="Deep insights into your daily sales, credit cycles, and high-turnover inventory. Data-driven growth."
                        href="/#analytics"
                        cta="View Analytics"
                        background={
                            <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-emerald-50 to-transparent opacity-60" />
                        }
                    />
                    <BentoCard
                        name="GST Compliance"
                        className="md:col-span-1 md:row-span-1"
                        Icon={FileText}
                        description="Professional tax invoices generated in seconds. Share directly via WhatsApp."
                        href="/#gst"
                        cta="See Templates"
                        background={
                            <div className="absolute -right-10 bottom-0 opacity-10 rotate-12">
                                <FileText size={180} />
                            </div>
                        }
                    />
                    <BentoCard
                        name="Ironclad Security"
                        className="md:col-span-1 md:row-span-1"
                        Icon={ShieldCheck}
                        description="AES-256 encryption for every transaction. Your data is your property, protected by enterprise-grade protocols."
                        href="/#security"
                        cta="Security Audit"
                        background={
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent" />
                        }
                    />
                </BentoGrid>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 pt-20 border-t border-zinc-100">
                    <FeaturePulse icon={Clock} title="Real-time Sync" desc="Cloud-first architecture" />
                    <FeaturePulse icon={Smartphone} title="Native App" desc="PWA & Mobile ready" />
                    <FeaturePulse icon={Globe} title="Multi-Store" desc="Manage all from one" />
                    <FeaturePulse icon={Zap} title="Instant Bills" desc="0.2s generation time" />
                </div>
            </div>
        </section>
    )
}

function FeaturePulse({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
    return (
        <div className="flex flex-col items-center text-center space-y-3 p-4 rounded-3xl hover:bg-zinc-50 transition-colors duration-300">
            <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-900 shadow-sm">
                <Icon size={20} />
            </div>
            <div>
                <h4 className="font-bold text-zinc-900 text-sm tracking-tight">{title}</h4>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{desc}</p>
            </div>
        </div>
    )
}
