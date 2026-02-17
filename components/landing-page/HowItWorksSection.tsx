"use client"

import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"
import { GradientText } from "@/components/gradient-text"

function StepCard({ number, title, description, color }: {
    number: string
    title: string
    description: string
    color: string
}) {
    const colorMap: Record<string, { bg: string; text: string }> = {
        emerald: { bg: "bg-emerald-100", text: "text-emerald-600" },
        amber: { bg: "bg-amber-100", text: "text-amber-600" },
        blue: { bg: "bg-blue-100", text: "text-blue-600" },
    }

    const c = colorMap[color]

    return (
        <div
            className="bg-white rounded-3xl p-8 md:p-10 shadow-lg border border-zinc-100 group relative overflow-hidden hover-scale"
        >
            <div className={`absolute top-0 right-0 w-32 h-32 ${c.bg} opacity-10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700`} />

            <div className={`w-16 h-16 md:w-20 md:h-20 ${c.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm relative z-10`}>
                <span className={`text-3xl md:text-4xl font-bold ${c.text}`}>{number}</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold mb-3 relative z-10">{title}</h3>
            <p className="text-zinc-500 text-lg relative z-10">{description}</p>

            {/* Connecting Line (for desktop) */}
            <div className="hidden md:block absolute top-1/2 -right-8 w-16 h-0.5 bg-gradient-to-r from-zinc-200 to-transparent z-0" />
        </div>
    )
}

export function HowItWorksSection() {
    return (
        <section id="how" className="py-24 md:py-32 px-6 bg-zinc-50 relative overflow-hidden">
            <div className="max-w-6xl mx-auto relative z-10">
                <AdvancedScrollReveal variant="fadeIn">
                    <div className="text-center mb-16 md:mb-20">
                        <span className="text-emerald-600 font-semibold text-sm tracking-wider uppercase bg-emerald-50 px-3 py-1 rounded-full">How It Works</span>
                        <div className="mt-4 flex justify-center">
                            <GradientText className="text-4xl md:text-5xl lg:text-6xl font-bold" colors={["#059669", "#0d9488", "#2563eb", "#059669"]}>
                                Simple as 1-2-3
                            </GradientText>
                        </div>
                    </div>
                </AdvancedScrollReveal>

                <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                    <AdvancedScrollReveal delay={0} variant="slideLeft">
                        <StepCard number="1" title="Sign Up Free" description="Create your account in 30 seconds." color="emerald" />
                    </AdvancedScrollReveal>
                    <AdvancedScrollReveal delay={300} variant="slideUp">
                        <StepCard number="2" title="Add Products" description="Set up inventory quickly." color="amber" />
                    </AdvancedScrollReveal>
                    <AdvancedScrollReveal delay={600} variant="slideRight">
                        <StepCard number="3" title="Start Selling" description="Create bills & track sales." color="blue" />
                    </AdvancedScrollReveal>
                </div>
            </div>
        </section>
    )
}
