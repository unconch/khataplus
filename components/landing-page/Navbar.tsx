"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
    Menu, X, ArrowRight
} from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { cn } from "@/lib/utils"

interface NavbarProps {
    isAuthenticated: boolean
    isLight?: boolean
    lightMode?: boolean
    orgSlug?: string | null
    isGuest?: boolean
}

export function Navbar({ isAuthenticated, isLight = false, lightMode = false, orgSlug }: NavbarProps) {
    const [scrolled, setScrolled] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50)
        }
        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = "hidden"
            return
        }
        document.body.style.overflow = ""
        return () => {
            document.body.style.overflow = ""
        }
    }, [mobileMenuOpen])

    const isSolid = isLight || lightMode || scrolled || mobileMenuOpen

    const primaryHref = isAuthenticated
        ? (orgSlug ? `/${orgSlug}/dashboard` : "/dashboard")
        : "/auth/sign-up"
    const primaryLabel = isAuthenticated
        ? "Go to Dashboard"
        : "Start Free Trial"
    const secondaryHref = isAuthenticated
        ? (orgSlug ? `/${orgSlug}/settings/profile` : "/settings/profile")
        : "/auth/login"
    const secondaryLabel = isAuthenticated
        ? "Settings"
        : "Sign In"

    return (
        <header className="fixed top-0 left-0 right-0 z-50">
            <div
                className={cn(
                    "transition-all duration-500 border-b backdrop-blur-xl",
                    isSolid
                        ? "bg-white/70 border-white/30 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)]"
                        : "bg-white/10 border-white/10"
                )}
            >
                <div className="max-w-7xl mx-auto px-6">
                    <div className="h-12 md:h-16 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-3">
                            <Logo size={42} className="text-emerald-600" />
                            <span className={cn("text-2xl font-black tracking-tighter italic", isSolid ? "text-slate-900" : "text-white")}>
                                KhataPlus
                            </span>
                        </Link>

                        <nav className="hidden md:flex items-center gap-10">
                            <DesktopNavLink href="/features" label="Features" solid={isSolid} />
                            <DesktopNavLink href="/pricing" label="Pricing" solid={isSolid} />
                            <DesktopNavLink href="/docs" label="Merchant Academy" solid={isSolid} />
                        </nav>

                        <div className="hidden md:flex items-center gap-4">
                            <Link
                                href={secondaryHref}
                                className={cn(
                                    "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                    isSolid
                                        ? "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                                        : "text-white/90 hover:text-white hover:bg-white/10"
                                )}
                            >
                                {secondaryLabel}
                            </Link>
                            <Link
                                href={primaryHref}
                                className={cn(
                                    "px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl",
                                    isSolid
                                        ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20"
                                        : "bg-white text-slate-900 hover:bg-slate-100 shadow-white/10"
                                )}
                            >
                                {primaryLabel}
                            </Link>
                        </div>

                        <button
                            className={cn("md:hidden p-2 -mr-2 transition-colors", isSolid ? "text-slate-900" : "text-white")}
                            onClick={() => setMobileMenuOpen((prev) => !prev)}
                            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                            aria-expanded={mobileMenuOpen}
                        >
                            {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <div
                className={cn(
                    "md:hidden transition-all duration-500 overflow-hidden border-b",
                    mobileMenuOpen ? "max-h-screen opacity-100 bg-white border-slate-200" : "max-h-0 opacity-0 border-transparent"
                )}
            >
                <div className="max-w-7xl mx-auto px-6 py-10 space-y-4">
                    <MobileNavLink href="/features" label="Features" onClick={() => setMobileMenuOpen(false)} />
                    <MobileNavLink href="/pricing" label="Pricing" onClick={() => setMobileMenuOpen(false)} />
                    <MobileNavLink href="/docs" label="Academy" onClick={() => setMobileMenuOpen(false)} />

                    <div className="pt-8 space-y-4">
                        <Link
                            href={secondaryHref}
                            className="block w-full text-center rounded-2xl border border-slate-200 px-6 py-4 text-slate-900 font-black uppercase tracking-widest text-xs hover:bg-slate-50"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            {secondaryLabel}
                        </Link>
                        <Link
                            href={primaryHref}
                            className="block w-full text-center rounded-2xl bg-emerald-600 px-6 py-4 text-white font-black uppercase tracking-widest text-xs hover:bg-emerald-700 shadow-xl shadow-emerald-500/20"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            {primaryLabel}
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    )
}

function DesktopNavLink({ href, label, solid = false }: { href: string; label: string; solid?: boolean }) {
    return (
        <Link
            href={href}
            className={cn(
                "inline-flex items-center gap-1 text-sm font-black uppercase tracking-widest transition-all",
                solid ? "text-slate-700 hover:text-emerald-600" : "text-white/90 hover:text-white"
            )}
        >
            <span>{label}</span>
        </Link>
    )
}

function MobileNavLink({ href, label, onClick }: { href: string; label: string; onClick: () => void }) {
    return (
        <Link
            href={href}
            className="flex items-center justify-between px-6 py-4 rounded-2xl text-slate-900 text-lg font-black italic tracking-tighter hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all"
            onClick={onClick}
        >
            {label}
            <ArrowRight size={18} className="text-emerald-500" />
        </Link>
    )
}
