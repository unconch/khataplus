"use client"

import { WifiOff, TrendingUp, ShieldCheck, FileText } from "lucide-react"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { BentoGrid, BentoCard } from "@/components/bento-grid"

export function FeaturesSection() {
    return (
        <section id="features" className="py-24 md:py-32 px-6">
            <div className="max-w-7xl mx-auto">
                <AdvancedScrollReveal variant="slideUp">
                    <div className="text-center mb-16 md:mb-20">
                        <span className="text-emerald-600 font-semibold text-sm tracking-wider uppercase bg-emerald-50 px-3 py-1 rounded-full">Features</span>
                        <div className="mt-4 flex justify-center">
                            <GradientText className="text-4xl md:text-5xl lg:text-6xl font-bold" colors={["#059669", "#0d9488", "#d97706", "#059669"]}>
                                Everything your shop needs
                            </GradientText>
                        </div>
                        <p className="text-zinc-500 text-xl max-w-2xl mx-auto mt-4">
                            From billing to inventory — all in one simple app.
                        </p>
                    </div>
                </AdvancedScrollReveal>

                <BentoGrid className="md:grid-rows-2">
                    <BentoCard
                        name="Works Offline"
                        className="col-span-1 lg:col-span-1"
                        Icon={WifiOff}
                        description="No internet? No problem. Create entries anytime, sync when you're back online."
                        href="#offline"
                        cta="Learn more"
                        background={
                            <div className="absolute top-10 right-10 opacity-40">
                                <div className="bg-zinc-100 rounded-lg p-2 transform rotate-6 border border-zinc-200">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-400" />
                                        <span className="text-xs text-zinc-500 font-mono">DISCONNECTED</span>
                                    </div>
                                </div>
                            </div>
                        }
                    />
                    <BentoCard
                        name="Smart Analytics"
                        className="col-span-1 lg:col-span-2"
                        Icon={TrendingUp}
                        description="Deep insights into your daily sales, credit, and inventory turnover. Know your business pulse."
                        href="#analytics"
                        cta="View Reports"
                        background={
                            <div className="absolute bottom-0 right-0 w-3/4 opacity-20">
                                <svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full fill-emerald-500">
                                    <path d="M0 100 V 80 Q 50 20 100 50 T 200 10 V 100 Z" />
                                </svg>
                            </div>
                        }
                    />
                    <BentoCard
                        name="Bank-Grade Security"
                        className="col-span-1 lg:col-span-1"
                        Icon={ShieldCheck}
                        description="Your data is encrypted and safe. Daily backups ensure you never lose a single entry."
                        href="#security"
                        cta="Security Specs"
                        background={
                            <div className="absolute -right-6 -top-6 text-emerald-100 opacity-50">
                                <ShieldCheck size={180} />
                            </div>
                        }
                    />
                    <BentoCard
                        name="GST Invoices"
                        className="col-span-1 lg:col-span-2"
                        Icon={FileText}
                        description="Generate professional GST-compliant tax invoices and share directly via WhatsApp."
                        href="#gst"
                        cta="See Templates"
                        background={
                            <div className="absolute top-8 right-8 w-40 h-56 bg-white border border-zinc-100 shadow-lg rounded-md p-3 opacity-60 transform rotate-3">
                                <div className="h-2 w-12 bg-zinc-200 rounded mb-2" />
                                <div className="space-y-1">
                                    <div className="h-1 w-full bg-zinc-100 rounded" />
                                    <div className="h-1 w-full bg-zinc-100 rounded" />
                                    <div className="h-1 w-2/3 bg-zinc-100 rounded" />
                                </div>
                            </div>
                        }
                    />
                </BentoGrid>
            </div>
        </section>
    )
}
