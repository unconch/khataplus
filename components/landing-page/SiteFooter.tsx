"use client"

import Link from "next/link"
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, ArrowUpRight, Github } from "lucide-react"
import { Logo } from "@/components/ui/logo"

export function SiteFooter() {
    return (
        <footer className="bg-white text-zinc-900 pt-24 pb-12 px-6 border-t border-zinc-100 relative overflow-hidden">
            {/* Subtle background detail */}
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="grid md:grid-cols-4 lg:grid-cols-5 gap-16 mb-24">
                    <div className="col-span-1 md:col-span-2 space-y-8">
                        <Link href="/" className="flex items-center gap-2">
                            <Logo size={40} />
                            <span className="text-3xl font-black tracking-tighter text-zinc-950">KhataPlus</span>
                        </Link>
                        <p className="text-zinc-500 max-w-sm text-lg font-medium leading-relaxed">
                            Empowering millions of Indian businesses with simple, powerful, and secure digital tools. Made with high precision for the modern merchant.
                        </p>
                        <div className="flex gap-4">
                            {[
                                { Icon: Twitter, label: "Twitter" },
                                { Icon: Github, label: "GitHub" },
                                { Icon: Instagram, label: "Instagram" },
                                { Icon: Linkedin, label: "LinkedIn" }
                            ].map(({ Icon, label }, i) => (
                                <a
                                    key={i}
                                    href="#"
                                    className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400 hover:bg-zinc-950 hover:text-white hover:border-zinc-950 transition-all duration-500 group shadow-sm"
                                    aria-label={`Follow us on ${label}`}
                                    title={`Follow us on ${label}`}
                                >
                                    <Icon size={20} className="group-hover:scale-110 transition-transform" />
                                </a>
                            ))}
                        </div>
                    </div>

                    <FooterCol title="Product" links={[
                        { label: "Features", href: "#features" },
                        { label: "Growth Tools", href: "#growth-tools" },
                        { label: "Solutions", href: "#solutions" },
                        { label: "Pricing", href: "/pricing" }
                    ]} />

                    <FooterCol title="Resources" links={[
                        { label: "Help Center", href: "/docs" },
                        { label: "API Docs", href: "#" },
                        { label: "Community", href: "#" },
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

function FooterCol({ title, links }: { title: string, links: { label: string, href: string }[] }) {
    return (
        <div className="space-y-8">
            <h4 className="font-black italic tracking-tighter text-zinc-950 text-xl">{title}</h4>
            <ul className="space-y-4">
                {links.map((link, i) => (
                    <li key={i}>
                        <Link
                            href={link.href}
                            className="text-zinc-500 hover:text-zinc-950 transition-colors duration-300 font-bold flex items-center gap-1 group"
                        >
                            {link.label}
                            <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-emerald-600" />
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    )
}
