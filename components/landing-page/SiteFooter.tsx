"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { Logo } from "@/components/ui/logo"

export function SiteFooter() {
    return (
        <footer className="bg-transparent text-zinc-900 pt-24 pb-12 px-6 relative overflow-hidden">
            {/* SARVAM-STYLE RADIANCE - BOTTOM FINISH */}
            <div className="absolute inset-x-0 bottom-0 top-0 pointer-events-none z-0 overflow-hidden"
                style={{ maskImage: "linear-gradient(to bottom, transparent, black 15% 100%)" }}
            >
                <div className="absolute bottom-[-35%] left-[-20%] w-[110vw] h-[110vw] bg-[radial-gradient(circle_at_30%_70%,rgba(16,185,129,0.35)_0%,rgba(59,130,246,0.15)_45%,transparent_70%)] blur-[160px] rounded-full" />
                <div className="absolute bottom-[-25%] right-[-20%] w-[90vw] h-[90vw] bg-[radial-gradient(circle_at_70%_70%,rgba(99,102,241,0.28)_0%,rgba(6,182,212,0.12)_45%,transparent_70%)] blur-[140px] rounded-full" />

                {/* Noise overlay to match hero */}
                <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }} />
            </div>

            {/* Subtle top border detail */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent opacity-40" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="grid md:grid-cols-4 lg:grid-cols-5 gap-16 mb-24">
                    <div className="col-span-1 md:col-span-2 space-y-8">
                        <Link href="/" className="flex items-center gap-2">
                            <Logo size={40} />
                            <span className="text-3xl font-black tracking-tighter text-zinc-950">KhataPlus</span>
                        </Link>
                        <p className="text-zinc-500 max-w-sm text-lg font-medium leading-relaxed">
                            Built for hardworking shop owners. Simple tools to bill faster, manage stock, and keep every rupee clear.
                        </p>
                        {/* Social links intentionally hidden for now */}
                    </div>

                    <FooterCol title="Product" links={[
                        { label: "Features", href: "#features" },
                        { label: "Growth Tools", href: "#growth-tools" },
                        { label: "Solutions", href: "#solutions" },
                        { label: "Pricing", href: "/pricing" }
                    ]} />

                    <FooterCol title="Resources" links={[
                        { label: "Help Center", href: "/docs" },
                        { label: "API Docs", href: "#", comingSoon: true },
                        { label: "Community", href: "#", comingSoon: true },
                        { label: "Roadmap", href: "/roadmap" }
                    ]} />

                    <FooterCol title="Legal" links={[
                        { label: "Privacy Policy", href: "/privacy" },
                        { label: "Terms of Service", href: "/terms-and-condition" },
                        { label: "Refund Policy", href: "/legal/cancellation-refund" },
                        { label: "Security", href: "#security" }
                    ]} />
                </div>

                <div className="border-t border-zinc-100 pt-12 flex flex-col md:flex-row justify-between items-center gap-8 text-zinc-400 text-sm font-medium">
                    <div className="text-center md:text-left space-y-2">
                        <p>&copy; {new Date().getFullYear()} KhataPlus Inc. All rights reserved.</p>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-zinc-900 font-bold">Systems Operational</span>
                        </div>
                        <div className="h-4 w-px bg-zinc-200 hidden md:block" />
                        <div className="text-zinc-500 italic">Built in Northeast India 🇮🇳</div>
                    </div>
                </div>
            </div>
        </footer>
    )
}

function FooterCol({ title, links }: { title: string, links: { label: string, href: string, comingSoon?: boolean }[] }) {
    return (
        <div className="space-y-8">
            <h4 className="font-black italic tracking-tighter text-zinc-950 text-xl">{title}</h4>
            <ul className="space-y-4">
                {links.map((link, i) => (
                    <li key={i}>
                        <Link
                            href={link.href}
                            className="group inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-950 transition-colors duration-300 font-bold"
                        >
                            {link.label}
                            {link.comingSoon ? (
                                <span className="inline-flex shrink-0 items-center rounded-full border border-amber-300/80 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] leading-none text-amber-700 whitespace-nowrap">
                                    Coming Soon
                                </span>
                            ) : null}
                            {!link.comingSoon ? (
                                <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-emerald-600" />
                            ) : null}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    )
}
