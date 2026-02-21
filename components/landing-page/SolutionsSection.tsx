"use client"

import { Store, Truck, Briefcase, HandCoins } from "lucide-react"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { BentoGrid, BentoCard } from "@/components/bento-grid"

export function SolutionsSection() {
    return (
        <section id="solutions" className="py-24 md:py-32 px-6 bg-zinc-50/50">
            <div className="max-w-7xl mx-auto">
                <AdvancedScrollReveal variant="slideUp">
                    <div className="text-center mb-16 md:mb-20">
                        <span className="text-amber-600 font-semibold text-sm tracking-wider uppercase bg-amber-50 px-3 py-1 rounded-full">Solutions</span>
                        <div className="mt-4 flex justify-center">
                            <GradientText className="text-4xl md:text-5xl lg:text-6xl font-bold" colors={["#d97706", "#c2410c", "#ea580c", "#d97706"]}>
                                Tailored for your business
                            </GradientText>
                        </div>
                        <p className="text-zinc-500 text-xl max-w-2xl mx-auto mt-4">
                            Whether you run a small corner shop or a large distribution network, we have you covered.
                        </p>
                    </div>
                </AdvancedScrollReveal>

                <BentoGrid>
                    <BentoCard
                        name="Retail & Kirana"
                        className="col-span-1 lg:col-span-1"
                        Icon={Store}
                        description="Lightning-fast billing, stock tracking for thousands of items, and automatic low-stock alerts."
                        href="/for/retail/in/india"
                        cta="See Retail Features"
                        background={
                            <div className="absolute -right-4 -top-4 opacity-10 text-amber-600">
                                <Store size={220} />
                            </div>
                        }
                    />
                    <BentoCard
                        name="Wholesale & Distribution"
                        className="col-span-1 lg:col-span-2"
                        Icon={Truck}
                        description="Manage bulk orders, track multiple supplier ledgers, and handle large volume transactions with ease."
                        href="/for/wholesale/in/india"
                        cta="Explore Wholesale"
                        background={
                            <div className="absolute bottom-6 right-6 opacity-10 flex gap-4 rotate-12">
                                <Truck size={120} />
                                <Truck size={80} className="mt-8" />
                            </div>
                        }
                    />
                    <BentoCard
                        name="Digital Khata (Udhaar)"
                        className="col-span-1 lg:col-span-2"
                        Icon={HandCoins}
                        description="The modern way to manage customer credit. Automated reminders, clear balance sheets, and faster recoveries."
                        href="/for/khata/in/india"
                        cta="Record Udhaar"
                        background={
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-50" />
                        }
                    />
                    <BentoCard
                        name="Professional Services"
                        className="col-span-1 lg:col-span-1"
                        Icon={Briefcase}
                        description="GST-compliant tax invoices for services, detailed expense tracking, and instant P&L reporting."
                        href="/for/services/in/india"
                        cta="Get Started"
                        background={
                            <div className="absolute right-0 bottom-0 opacity-5">
                                <Briefcase size={200} />
                            </div>
                        }
                    />
                </BentoGrid>
            </div>
        </section>
    )
}
