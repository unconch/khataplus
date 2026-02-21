"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ChevronDown, Menu, X } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { cn } from "@/lib/utils"

interface NavbarProps {
    isAuthenticated: boolean
    lightMode?: boolean
    orgSlug?: string | null
    isGuest?: boolean
}

function DesktopNavLink({ href, label, withCaret = false, solid = false }: { href: string; label: string; withCaret?: boolean; solid?: boolean }) {
    return (
        <Link
            href={href}
            className={cn(
                "inline-flex items-center gap-1 text-sm font-medium transition-colors",
                solid ? "text-slate-700 hover:text-sky-700" : "text-white/90 hover:text-white"
            )}
        >
            <span>{label}</span>
            {withCaret ? <ChevronDown className="h-4 w-4 opacity-70" /> : null}
        </Link>
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

    const isSolid = lightMode || scrolled || mobileMenuOpen
    const primaryHref = isAuthenticated ? "/dashboard" : "/auth/sign-up"
    const primaryLabel = isAuthenticated ? "Go to Dashboard" : "Start Free Trial"
    const secondaryHref = isAuthenticated ? "/dashboard" : "/auth/login"
    const secondaryLabel = isAuthenticated ? "Dashboard" : "Sign In"

    const navItems = useMemo(
        () => [
            { href: "/#features", label: "Features", withCaret: false },
            { href: "/#solutions", label: "Solutions", withCaret: true },
            { href: "/pricing", label: "Pricing" },
            { href: "/#faq", label: "Knowledge Center", withCaret: true },
            { href: "/terms", label: "Contact Us" },
        ],
        []
    )

    return (
        <header className="fixed top-0 left-0 right-0 z-50">
            <div
                className={cn(
                    "transition-all duration-500 border-b",
                    isSolid
                        ? "bg-white/90 border-slate-200/80 backdrop-blur-xl shadow-sm"
                        : "bg-transparent border-transparent"
                )}
            >
                <div className="max-w-7xl mx-auto px-6">
                    <div className="h-14 md:h-16 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-3">
                            <Logo size={30} className="text-emerald-600" />
                            <span className={cn("text-lg md:text-xl font-black tracking-tight", isSolid ? "text-slate-900" : "text-white")}>
                                KhataPlus
                            </span>
                        </Link>

                        <nav className="hidden md:flex items-center gap-6">
                            {navItems.map((item) => (
                                <DesktopNavLink
                                    key={item.label}
                                    href={item.href}
                                    label={item.label}
                                    withCaret={item.withCaret}
                                    solid={isSolid}
                                />
                            ))}
                        </nav>

                        <div className="hidden md:flex items-center gap-3">
                            <Link
                                href={secondaryHref}
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-sm font-semibold transition-all",
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
                                    "px-5 py-2 rounded-full text-sm font-bold transition-all",
                                    isSolid
                                        ? "bg-slate-900 text-white hover:bg-slate-800"
                                        : "bg-white text-slate-900 hover:bg-slate-100"
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

            <div
                className={cn(
                    "md:hidden transition-all duration-300 overflow-hidden border-b",
                    mobileMenuOpen ? "max-h-[480px] opacity-100 bg-white border-slate-200" : "max-h-0 opacity-0 border-transparent"
                )}
            >
                <div className="max-w-7xl mx-auto px-6 py-6 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="block px-4 py-3 rounded-xl text-slate-700 text-base font-medium hover:bg-slate-100"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            {item.label}
                        </Link>
                    ))}
                    <div className="pt-4 space-y-3">
                        <Link
                            href={secondaryHref}
                            className="block w-full text-center rounded-xl border border-slate-200 px-4 py-3 text-slate-700 font-semibold hover:bg-slate-50"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            {secondaryLabel}
                        </Link>
                        <Link
                            href={primaryHref}
                            className="block w-full text-center rounded-xl bg-slate-900 px-4 py-3 text-white font-semibold hover:bg-slate-800"
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
