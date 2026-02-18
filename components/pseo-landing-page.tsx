"use client"

import {
    CheckCircle2,
    ArrowRight,
    IndianRupee,
    ShieldCheck,
    BarChart3,
    Users,
    Store,
    MapPin,
    Zap,
    Rocket
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Logo } from "@/components/ui/logo"

interface PSEOLandingPageProps {
    category: string
    city: string
}

export function PSEOLandingPage({ category, city }: PSEOLandingPageProps) {
    const formattedCategory = (category || "Retail").split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    const formattedCity = (city || "India").split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950">
            {/* SEO Sticky Nav */}
            <div className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-100 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <Logo size={32} />
                        <span className="font-black italic tracking-tighter text-xl">KHATAPLUS</span>
                    </Link>
                    <Link href="/auth/sign-up">
                        <Button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest px-6 h-11">
                            Start Free Trial
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Vertical Specific Hero */}
            <section className="relative py-24 md:py-40 overflow-hidden">
                <div className="absolute inset-0 bg-emerald-500/5 -z-10" />
                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        <div
                            className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/10 text-emerald-600 font-black text-[10px] uppercase tracking-widest animate-in fade-in slide-in-from-left-4 duration-500"
                        >
                            <MapPin size={12} />
                            Best in {formattedCity}
                        </div>

                        <h1
                            className="text-5xl md:text-7xl font-black italic tracking-tighter leading-tight animate-in fade-in slide-up duration-700"
                        >
                            THE #1 BILLING APP FOR <span className="text-emerald-500 underline decoration-emerald-500/30 underline-offset-8">{formattedCategory.endsWith('y') ? formattedCategory.slice(0, -1).toUpperCase() + 'IES' : formattedCategory.toUpperCase() + 'S'}</span> IN {formattedCity.toUpperCase()}
                        </h1>

                        <p
                            className="text-xl text-muted-foreground leading-relaxed max-w-xl animate-in fade-in slide-up duration-700 delay-100"
                        >
                            Specifically designed for {category} businesses in {city}. Manage your GST invoices, track Udhaar, and grow your sales 2x faster.
                        </p>

                        <div
                            className="flex flex-col sm:flex-row gap-4 pt-4 animate-in fade-in slide-up duration-700 delay-200"
                        >
                            <Link href="/auth/sign-up" className="flex-1">
                                <Button className="w-full h-16 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3">
                                    Get Started for Free <ArrowRight size={18} />
                                </Button>
                            </Link>
                            <Link href="/demo" className="flex-1">
                                <Button variant="outline" className="w-full h-16 rounded-[2rem] border-2 border-zinc-100 dark:border-white/10 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3">
                                    View Live Demo
                                </Button>
                            </Link>
                        </div>

                        <div className="flex items-center gap-8 pt-8 border-t border-zinc-100 dark:border-white/5 opacity-60">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                <CheckCircle2 size={16} className="text-emerald-500" /> No Credit Card
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                <CheckCircle2 size={16} className="text-emerald-500" /> Works Offline
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                <CheckCircle2 size={16} className="text-emerald-500" /> GST Ready
                            </div>
                        </div>
                    </div>

                    <div
                        className="relative hidden md:block animate-in fade-in scale-in duration-1000 origin-right transition-transform"
                    >
                        <div className="absolute inset-0 bg-emerald-500/20 blur-[120px] rounded-full -z-10" />
                        <div className="bg-white dark:bg-zinc-900 rounded-[3rem] p-12 shadow-3xl border border-zinc-100 dark:border-white/5 space-y-10">
                            <div className="flex justify-between items-start">
                                <h3 className="text-2xl font-black italic tracking-tight">Built for {formattedCategory}s</h3>
                                <div className="h-12 w-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white">
                                    <Store size={24} />
                                </div>
                            </div>

                            <div className="space-y-6">
                                {[
                                    { icon: <IndianRupee />, text: "Automated GST & Profit Tracking" },
                                    { icon: <Users />, text: "Customer Udhaar Management" },
                                    { icon: <Zap />, text: "Super Fast Billing in seconds" },
                                ].map((feature, i) => (
                                    <div key={i} className="flex items-center gap-4 group">
                                        <div className="h-10 w-10 bg-zinc-50 dark:bg-white/5 rounded-xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                            {feature.icon}
                                        </div>
                                        <span className="font-bold text-lg">{feature.text}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-8 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rating</p>
                                    <div className="flex gap-1 text-amber-500">
                                        {"★★★★★"}
                                    </div>
                                </div>
                                <div className="text-right space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Users in {formattedCity}</p>
                                    <p className="font-black italic text-xl">1,240+</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Local Trust Section */}
            <section className="py-24 bg-zinc-50 dark:bg-white/5">
                <div className="max-w-7xl mx-auto px-6 text-center space-y-16">
                    <div className="space-y-4">
                        <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter">WHY {formattedCity.toUpperCase()} TRUSTS KHATAPLUS?</h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Digitizing shops across {city} with local language support and lightning fast performance.</p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-8">
                        {[
                            { label: "FASTER BILLING", val: "2X", icon: <Zap /> },
                            { label: "RECOVERY RATE", val: "40%", icon: <BarChart3 /> },
                            { label: "SETUP TIME", val: "60s", icon: <Rocket /> },
                            { label: "TRUSTED BY", val: "10k+", icon: <ShieldCheck /> }
                        ].map((stat, i) => (
                            <div key={i} className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-zinc-100 dark:border-white/5 space-y-4">
                                <div className="mx-auto h-12 w-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600">
                                    {stat.icon}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-4xl font-black italic text-zinc-900 dark:text-white">{stat.val}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 border-t border-zinc-200 dark:border-white/5">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
                    <div className="flex items-center gap-3">
                        <Logo size={24} />
                        <span className="font-black italic tracking-tighter">KHATAPLUS</span>
                    </div>
                    <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        <Link href="/privacy" className="hover:text-emerald-500">Privacy Policy</Link>
                        <Link href="/terms-and-condition" className="hover:text-emerald-500">Terms of Service</Link>
                        <Link href="/beta" className="text-emerald-600 font-black">Early Access</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}
