"use client"

import { TrendingUp, Zap, Star, Package, BarChart3, Activity } from "lucide-react"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { cn } from "@/lib/utils"

export function AnalyticsSection() {
    return (
        <section id="analytics" className="py-20 md:py-32 px-6 bg-zinc-50 relative overflow-hidden">
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] bg-[length:30px_30px]" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-20">
                    <div className="w-full lg:w-1/2 space-y-10">
                        <AdvancedScrollReveal variant="slideRight">
                            <div className="space-y-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                                    <BarChart3 size={12} />
                                    Smart Reports
                                </div>
                                <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-zinc-900 leading-[0.9] uppercase italic">
                                    Track Your <br />
                                    <GradientText className="inline" colors={["#059669", "#10b981", "#34d399"]}>
                                        Profits Grow.
                                    </GradientText>
                                </h2>
                                <p className="text-zinc-500 text-lg font-medium leading-relaxed max-w-xl">
                                    Check your daily sales, track your stock, and see exactly where you are making profit. Simple reports for a better business.
                                </p>
                            </div>
                        </AdvancedScrollReveal>

                        <div className="grid grid-cols-2 gap-4">
                            <StatCard icon={Zap} label="Sales Growth" value="+24%" subValue="Monthly Growth" color="emerald" />
                            <StatCard icon={Star} label="Best Items" value="Automatic" subValue="Top Selling" color="blue" />
                            <StatCard icon={Package} label="Stock Status" value="Live" subValue="Always Updated" color="amber" />
                            <StatCard icon={Activity} label="Cash Flow" value="Safe" subValue="Clear Ledger" color="indigo" />
                        </div>
                    </div>

                    <div className="w-full lg:w-1/2">
                        <AdvancedScrollReveal variant="scaleUp">
                            <div className="relative p-1 bg-gradient-to-br from-zinc-200 to-zinc-50 rounded-[2.5rem] shadow-2xl">
                                <div className="relative bg-zinc-950 rounded-[2.2rem] p-8 md:p-10 aspect-video flex flex-col justify-between overflow-hidden group">
                                    <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />

                                    <div className="flex justify-between items-start relative z-10">
                                        <div className="space-y-1">
                                            <div className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">Today's Total Sale</div>
                                            <div className="text-2xl font-black text-white italic tracking-tighter">₹ 4,28,450.00</div>
                                        </div>
                                        <div className="bg-white/5 p-2 rounded-xl border border-white/10 backdrop-blur-xl">
                                            <TrendingUp className="text-emerald-400" size={18} />
                                        </div>
                                    </div>

                                    <div className="relative h-32 flex items-end gap-2 md:gap-3 mb-6">
                                        {[40, 70, 45, 90, 65, 80, 50, 95, 60, 85, 55, 75].map((h, i) => (
                                            <div
                                                key={i}
                                                className="flex-1 min-w-[3px] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-sm transition-transform duration-700 origin-bottom"
                                                style={{ height: `${h}%`, transitionDelay: `${i * 40}ms` }}
                                            />
                                        ))}
                                    </div>

                                    <div className="flex justify-between items-center text-zinc-500 text-[8px] font-black uppercase tracking-widest border-t border-white/5 pt-4">
                                        <span>Jan</span>
                                        <span>Feb</span>
                                        <span>Mar</span>
                                        <span>Apr</span>
                                        <span>May</span>
                                        <span>Jun</span>
                                    </div>

                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                                        <div className="bg-emerald-500/90 backdrop-blur-xl px-4 py-2 rounded-full text-[9px] text-zinc-950 font-black uppercase tracking-widest whitespace-nowrap">
                                            Peak Sales Observed
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

function StatCard({ icon: Icon, label, value, subValue, color }: { icon: any, label: string, value: string, subValue: string, color: string }) {
    const colorStyles: any = {
        emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
        blue: "text-blue-600 bg-blue-50 border-blue-100",
        amber: "text-amber-600 bg-amber-50 border-amber-100",
        indigo: "text-indigo-600 bg-indigo-50 border-indigo-100"
    }

    return (
        <div className="p-5 rounded-2xl bg-white border border-zinc-100 shadow-sm hover:shadow-lg transition-all duration-500 group">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", colorStyles[color])}>
                <Icon size={18} />
            </div>
            <div>
                <div className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">{label}</div>
                <div className="text-xl font-black text-zinc-900 tracking-tighter leading-none mb-1.5 uppercase italic">{value}</div>
                <div className="text-[9px] font-bold text-zinc-500 uppercase">{subValue}</div>
            </div>
        </div>
    )
}
