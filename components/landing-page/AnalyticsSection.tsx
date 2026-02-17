"use client"

import { TrendingUp, Zap, Star, Package, ArrowUpRight } from "lucide-react"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"
import { GradientText } from "@/components/gradient-text"

export function AnalyticsSection() {
    return (
        <section id="analytics" className="py-24 md:py-32 px-6 bg-zinc-50">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row items-center gap-16">
                    <div className="w-full md:w-1/2">
                        <AdvancedScrollReveal variant="slideRight">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-sm font-bold mb-6 border border-emerald-100/50 shadow-sm">
                                <TrendingUp size={16} />
                                Insights
                            </div>
                            <GradientText className="text-4xl md:text-6xl font-extrabold mb-6" colors={["#059669", "#10b981", "#34d399"]}>
                                Know your business pulse.
                            </GradientText>
                            <p className="text-zinc-500 text-xl mb-10 leading-relaxed max-w-xl">
                                Visualize your growth with powerful analytics. Track sales trends, monitor inventory health, and identify your most profitable items. <span className="text-emerald-600 font-bold block mt-2 text-base">Advanced insights available in our Analytics Add-on.</span>
                            </p>
                            <div className="grid grid-cols-2 gap-4 md:gap-6">
                                {[
                                    { label: "Daily Sales", value: "Real-time", icon: Zap },
                                    { label: "Top Items", value: "Automated", icon: Star },
                                    { label: "Inventory", value: "Live Status", icon: Package },
                                    { label: "Profit Margin", value: "Calculated", icon: ArrowUpRight }
                                ].map((stat, i) => (
                                    <div
                                        key={i}
                                        className="p-5 bg-white rounded-3xl border border-zinc-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_30px_-10px_rgba(16,185,129,0.2)] transition-all duration-300 group hover-scale"
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                                                <stat.icon size={16} />
                                            </div>
                                            <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">{stat.label}</div>
                                        </div>
                                        <div className="text-emerald-600 font-black text-xl md:text-2xl">{stat.value}</div>
                                    </div>
                                ))}
                            </div>
                        </AdvancedScrollReveal>
                    </div>
                    <div className="w-full md:w-1/2">
                        <AdvancedScrollReveal variant="scaleUp">
                            <div className="bg-zinc-900 rounded-[2.5rem] p-8 aspect-video relative overflow-hidden flex flex-col justify-end">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
                                <div className="relative flex items-end justify-between gap-2 h-32 mb-4">
                                    {[40, 70, 45, 90, 65, 80, 50, 95, 60, 85].map((h, i) => (
                                        <div
                                            key={i}
                                            className="flex-1 bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-sm transition-all duration-1000 ease-out origin-bottom scale-y-0 [.reveal-container[data-visible=true]_&]:scale-y-100"
                                            style={{
                                                height: `${h}%`,
                                                transitionDelay: `${i * 50}ms`,
                                            }}
                                        />
                                    ))}
                                </div>
                                <div className="flex justify-between items-center text-zinc-400 text-xs font-mono uppercase tracking-widest border-t border-white/5 pt-4">
                                    <span>Mon</span>
                                    <span>Tue</span>
                                    <span>Wed</span>
                                    <span>Thu</span>
                                    <span>Fri</span>
                                    <span>Sat</span>
                                    <span>Sun</span>
                                </div>
                            </div>
                        </AdvancedScrollReveal>
                    </div>
                </div>
            </div>
        </section>
    )
}
