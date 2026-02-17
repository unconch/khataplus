"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"

interface NavbarProps {
    isAuthenticated: boolean
    lightMode?: boolean
    orgSlug?: string | null
    isGuest?: boolean
}

function NavLink({ href, label, isExternal = false }: { href: string; label: string; isExternal?: boolean }) {
    if (isExternal) {
        return (
            <Link href={href} className="relative group py-1">
                <span className="hover:text-emerald-500 transition-colors uppercase tracking-tight">{label}</span>
            </Link>
        )
    }
    return (
        <a href={href} className="relative group py-1">
            <span className="hover:text-emerald-500 transition-colors uppercase tracking-tight">{label}</span>
        </a>
    )
}

export function Navbar({ isAuthenticated, lightMode = false }: NavbarProps) {
    const [scrolled, setScrolled] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50)
        }
        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-in-out transform translate-y-0 animate-slide-down ${scrolled
                ? "bg-white/80 backdrop-blur-xl border-b border-zinc-100 shadow-sm py-0"
                : lightMode ? "bg-white/50 backdrop-blur-md py-2" : "bg-transparent py-2"
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 h-20 md:h-24 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="transition-transform duration-300 group-hover:rotate-12">
                        <Logo size={36} className="text-emerald-600" />
                    </div>
                    <span className={`font-black text-2xl tracking-tighter transition-colors duration-500 ${(scrolled || lightMode) ? "text-zinc-900" : "text-white"}`}>
                        KhataPlus
                    </span>
                </Link>

                <div
                    className={`hidden md:flex items-center gap-6 lg:gap-10 text-[11px] font-black tracking-[0.1em] uppercase transition-colors duration-500 ${(scrolled || lightMode) ? "text-zinc-500" : "text-zinc-50/70 hover:text-white"}`}
                >
                    <NavLink href="/#features" label="Features" />
                    <NavLink href="/pricing" label="Pricing" isExternal={true} />
                    <Link href="/tools/gst-calculator" className="hover:text-emerald-600 transition-colors">GST Tool</Link>
                    <Link href="/tools/business-card" className="hover:text-emerald-600 transition-colors">Card Maker</Link>
                    <a href="/demo" className="font-black text-emerald-600 hover:text-emerald-500 transition-colors">Demo</a>
                </div>

                <div className="hidden md:flex items-center gap-4">
                    <Link href="/auth/login">
                        <Button variant="ghost" size="lg" className={`text-sm font-bold tracking-widest uppercase hover:bg-zinc-50 ${(scrolled || lightMode) ? "text-zinc-500 hover:text-zinc-900" : "text-white/80 hover:text-white hover:bg-white/10"}`}>
                            Sign In
                        </Button>
                    </Link>
                    <Link href="/auth/sign-up">
                        <button className="bg-zinc-900 text-white hover:bg-black rounded-full px-8 py-3 text-sm font-black tracking-tighter shadow-xl transform transition-all duration-300 hover:scale-105 active:scale-95">
                            Sign Up
                        </button>
                    </Link>
                </div>

                <button
                    className={`md:hidden p-2 -mr-2 ${(scrolled || lightMode) ? "text-zinc-900" : "text-white"}`}
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>

            {/* Mobile Menu */}
            <div
                className={`md:hidden overflow-hidden transition-all duration-500 ease-in-out ${mobileMenuOpen ? "max-h-[500px] border-t border-white/5 opacity-100" : "max-h-0 opacity-0"
                    } bg-zinc-950/95 backdrop-blur-2xl`}
            >
                <div className="px-6 py-6 space-y-2">
                    <Link href="/#features" className="block px-4 py-4 text-xl text-zinc-300 font-bold rounded-2xl hover:bg-white/5" onClick={() => setMobileMenuOpen(false)}>Features</Link>
                    <Link href="/pricing" className="block px-4 py-4 text-xl text-zinc-300 font-bold rounded-2xl hover:bg-white/5" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
                </div>
                <div className="px-6 pb-10 space-y-4">
                    <Link href="/auth/login" className="block w-full text-center py-4 text-zinc-400 font-bold text-lg" onClick={() => setMobileMenuOpen(false)}>
                        Login
                    </Link>
                    <Link href="/auth/sign-up" className="block" onClick={() => setMobileMenuOpen(false)}>
                        <Button size="lg" className="w-full h-16 bg-white text-zinc-950 hover:bg-emerald-50 rounded-full text-lg font-black shadow-2xl">
                            Sign Up
                        </Button>
                    </Link>
                </div>
            </div>
        </nav>
    )
}
