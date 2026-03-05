"use client"

import Link from "next/link"
import { AdvancedScrollReveal } from "@/components/advanced-scroll-reveal"
import { Sparkles, UserPlus, PackagePlus, Rocket, ArrowRight } from "lucide-react"

export function HowItWorksSection() {
    return (
        <section id="how" className="py-24 md:py-32 px-6 bg-transparent relative overflow-hidden">
            {/* Ambient Background Glows - Faded Boundary */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
                style={{ maskImage: "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)" }}
            >
                <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-rose-400/20 blur-[150px] rounded-full mix-blend-multiply" />
                <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-fuchsia-400/20 blur-[150px] rounded-full mix-blend-multiply" />
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                <div className="text-center mb-24 space-y-4 flex flex-col items-center">
                    <AdvancedScrollReveal variant="slideUp">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 border border-zinc-200/50 backdrop-blur-md mb-8 shadow-sm">
                            <Sparkles size={14} className="text-rose-500" />
                            <span className="text-zinc-600 font-bold text-[11px] tracking-[0.2em] uppercase">Simple Onboarding</span>
                        </div>
                        <h2 className="text-5xl md:text-7xl font-semibold tracking-tighter text-zinc-900 leading-[1.05]">
                            Start billing in <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-fuchsia-500 to-purple-600">under 5 minutes.</span>
                        </h2>
                    </AdvancedScrollReveal>
                </div>

                {/* Elegant Vertical Timeline */}
                <div className="relative isolate pt-8">
                    {/* The glowing active line */}
                    <div className="absolute left-10 md:left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-rose-400 via-fuchsia-400 to-transparent -translate-x-1/2 -z-10 opacity-60 blur-[1px]" />
                    <div className="absolute left-10 md:left-1/2 top-0 bottom-0 w-px bg-zinc-200 -translate-x-1/2 -z-10" />

                    <div className="space-y-20">
                        <TimelineStep
                            number="01"
                            icon={UserPlus}
                            title="Create your profile"
                            desc="Enter basic business details. Add your GST number if you have one, or skip it. Set up staff accounts in seconds."
                            align="right"
                            color="text-rose-600"
                            shadow="shadow-[0_4px_20px_rgba(244,63,94,0.15)]"
                            glowBar="bg-rose-100"
                        />
                        <TimelineStep
                            number="02"
                            icon={PackagePlus}
                            title="Import inventory"
                            desc="Upload your existing items via Excel, or add them manually with our built-in barcode scanner support."
                            align="left"
                            color="text-fuchsia-600"
                            shadow="shadow-[0_4px_20px_rgba(217,70,239,0.15)]"
                            glowBar="bg-fuchsia-100"
                        />
                        <TimelineStep
                            number="03"
                            icon={Rocket}
                            title="Begin selling"
                            desc="Create your first invoice, track customer credit, and watch your daily analytics update in real-time."
                            align="right"
                            color="text-purple-600"
                            shadow="shadow-[0_4px_20px_rgba(168,85,247,0.15)]"
                            glowBar="bg-purple-100"
                        />
                    </div>
                </div>

                {/* Fluid Glass CTA Banner */}
                <AdvancedScrollReveal variant="slideUp" delay={300} className="mt-40">
                    <div className="bg-white/30 backdrop-blur-2xl border border-white/70 rounded-[3rem] p-10 md:p-16 text-center max-w-3xl mx-auto shadow-[0_35px_90px_-22px_rgba(0,0,0,0.2)] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-sky-100/45 via-rose-100/35 to-white/15 opacity-95 transition-opacity duration-1000 pointer-events-none" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.92),transparent_38%),radial-gradient(circle_at_88%_84%,rgba(255,255,255,0.38),transparent_45%)] pointer-events-none" />
                        <div className="absolute -top-10 -left-6 w-56 h-56 rounded-full bg-white/40 blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-16 -right-8 w-72 h-72 rounded-full bg-cyan-200/30 blur-3xl pointer-events-none" />
                        <div className="absolute inset-[1px] rounded-[calc(3rem-1px)] border border-white/70 pointer-events-none" />
                        <div className="absolute -inset-x-16 -top-24 h-48 bg-white/55 blur-2xl rotate-6 group-hover:translate-x-8 transition-transform duration-1000 pointer-events-none" />

                        <h3 className="text-3xl md:text-5xl font-semibold tracking-tighter text-zinc-900 mb-8 relative z-10">Ready to run your <br /> business smarter?</h3>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10 mt-10">
                            <Link href="/auth/sign-up" className="px-8 py-4 rounded-2xl bg-zinc-900/88 text-white font-semibold tracking-wide hover:bg-zinc-900 transition-colors shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 duration-300 w-full sm:w-auto border border-white/15 backdrop-blur-md">
                                Start Free
                            </Link>
                            <Link href="#demo" className="px-8 py-4 rounded-2xl bg-white/55 backdrop-blur-xl border border-white/85 text-zinc-900 font-semibold tracking-wide hover:bg-white/75 transition-colors w-full sm:w-auto flex items-center justify-center gap-2 group/demo shadow-sm">
                                See Demo
                                <ArrowRight size={18} className="text-zinc-500 group-hover/demo:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </AdvancedScrollReveal>
            </div>
        </section>
    )
}

function TimelineStep({ number, icon: Icon, title, desc, align, color, shadow, glowBar }: any) {
    return (
        <AdvancedScrollReveal variant={align === 'left' ? 'slideRight' : 'slideLeft'} className="group">
            <div className={`flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-16 relative ${align === 'left' ? 'md:flex-row-reverse' : ''}`}>

                {/* Content Side */}
                <div className={`w-full md:w-[calc(50%-4rem)] ${align === 'left' ? 'md:text-left' : 'md:text-right'} pl-20 md:pl-0`}>
                    <div className={`inline-flex items-center gap-4 mb-4 ${align === 'left' ? '' : 'md:flex-row-reverse'}`}>
                        <span className={`${color} font-mono text-base font-bold tracking-widest`}>{number}</span>
                        <div className={`h-1 w-12 ${glowBar} rounded-full`} />
                    </div>
                    <h3 className="text-3xl font-semibold tracking-tight text-zinc-900 mb-4 group-hover:text-black transition-colors">{title}</h3>
                    <p className="text-zinc-500 leading-relaxed font-medium text-lg">{desc}</p>
                </div>

                {/* Center Node */}
                <div className={`absolute left-10 md:left-1/2 top-0 md:top-1/2 -translate-y-1/2 -translate-x-1/2 w-16 h-16 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center z-10 transition-transform duration-500 group-hover:scale-110 group-hover:border-zinc-300 ${shadow}`}>
                    <Icon size={24} strokeWidth={1.5} className={color} />
                </div>

                {/* Empty Side for Spacing */}
                <div className="hidden md:block w-[calc(50%-4rem)]" />
            </div>
        </AdvancedScrollReveal>
    )
}
