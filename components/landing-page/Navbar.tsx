"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
    Menu, X, ArrowRight
} from "lucide-react"
import { useLocale } from "@/components/locale-provider"
import { Logo } from "@/components/ui/logo"
import { cn } from "@/lib/utils"
import { useMainAuthUrls } from "@/hooks/use-main-auth-urls"

interface NavbarProps {
    isAuthenticated: boolean
    isLight?: boolean
    lightMode?: boolean
    orgSlug?: string | null
    isGuest?: boolean
    forcePublicActions?: boolean
}

export function Navbar({ isAuthenticated, isLight = false, lightMode = false, orgSlug, isGuest = false, forcePublicActions = false }: NavbarProps) {
    const { dictionary } = useLocale()
    const [scrolled, setScrolled] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const scrolledRef = useRef(false)
    const rafRef = useRef<number | null>(null)
    const { signInUrl, signUpUrl } = useMainAuthUrls()

    useEffect(() => {
        const updateScrolled = () => {
            const nextScrolled = window.scrollY > 50
            if (nextScrolled !== scrolledRef.current) {
                scrolledRef.current = nextScrolled
                setScrolled(nextScrolled)
            }
        }

        const handleScroll = () => {
            if (rafRef.current !== null) {
                return
            }
            rafRef.current = window.requestAnimationFrame(() => {
                updateScrolled()
                rafRef.current = null
            })
        }

        updateScrolled()
        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => {
            window.removeEventListener("scroll", handleScroll)
            if (rafRef.current !== null) {
                window.cancelAnimationFrame(rafRef.current)
            }
        }
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
    const useSolidPalette = isSolid

    const isPublicVisitor = forcePublicActions || !isAuthenticated || isGuest

    const primaryHref = isPublicVisitor
        ? signUpUrl
        : (orgSlug ? `/${orgSlug}/dashboard` : "/dashboard")
    const primaryLabel = isPublicVisitor
        ? dictionary.navbar.startFreeTrial
        : dictionary.navbar.goToDashboard
    const secondaryHref = isPublicVisitor
        ? signInUrl
        : (orgSlug ? `/${orgSlug}/settings/profile` : "/settings/profile")
    const secondaryLabel = isPublicVisitor
        ? dictionary.navbar.signIn
        : dictionary.navbar.settings

    return (
        <header className="fixed top-0 left-0 right-0 z-50">
            <div className="mx-auto max-w-7xl px-4 pt-4 md:px-6 md:pt-5">
                <div
                    className={cn(
                        "relative rounded-[2rem] border shadow-[0_18px_40px_-28px_rgba(15,23,42,0.18)] transition-all duration-500 backdrop-blur-xl",
                        useSolidPalette
                            ? "border-zinc-200/80 bg-white/92"
                            : "border-white/40 bg-white/82"
                    )}
                >
                    <div className="relative flex h-16 items-center justify-between px-5 md:h-[72px] md:px-6">
                        <Link href="/" className="shrink-0 flex items-center gap-3">
                            <Logo size={38} className="text-emerald-600" />
                            <span className="text-[2rem] font-black tracking-[-0.05em] italic leading-none text-slate-950">
                                KhataPlus
                            </span>
                        </Link>

                        <nav className="hidden flex-1 items-center justify-center gap-10 px-8 md:flex">
                            <DesktopNavLink href="/features" label={dictionary.navbar.features} solid={useSolidPalette} />
                            <DesktopNavLink href="/roadmap" label={dictionary.navbar.roadmap} solid={useSolidPalette} />
                            <DesktopNavLink href="/pricing" label={dictionary.navbar.pricing} solid={useSolidPalette} />
                            <DesktopNavLink href="/docs" label={dictionary.navbar.merchantAcademy} solid={useSolidPalette} />
                        </nav>

                        <div className="hidden shrink-0 items-center gap-5 md:flex">
                            <Link
                                href={secondaryHref}
                                className={cn(
                                    "inline-flex items-center justify-center py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-600 transition-all hover:text-slate-950"
                                )}
                            >
                                {secondaryLabel}
                            </Link>
                            <Link
                                href={primaryHref}
                                className={cn(
                                    "inline-flex items-center justify-center rounded-[1rem] px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-white transition-all",
                                    "bg-[linear-gradient(180deg,#232323_0%,#141414_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_24px_-16px_rgba(0,0,0,0.55)] hover:-translate-y-[1px] hover:bg-[linear-gradient(180deg,#2b2b2b_0%,#181818_100%)]"
                                )}
                            >
                                {primaryLabel}
                            </Link>
                        </div>

                        <button
                            className="p-2 -mr-2 text-slate-900 transition-colors md:hidden"
                            onClick={() => setMobileMenuOpen((prev) => !prev)}
                            aria-label={mobileMenuOpen ? dictionary.navbar.closeMenu : dictionary.navbar.openMenu}
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
                    "mx-4 mt-3 overflow-hidden rounded-[2rem] border bg-white/92 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)] transition-all duration-500 backdrop-blur-xl md:hidden",
                    mobileMenuOpen ? "max-h-screen border-slate-200 opacity-100" : "max-h-0 border-transparent opacity-0"
                )}
            >
                <div className="mx-auto max-w-7xl space-y-4 px-6 py-8">
                    <MobileNavLink href="/features" label={dictionary.navbar.features} onClick={() => setMobileMenuOpen(false)} />
                    <MobileNavLink href="/roadmap" label={dictionary.navbar.roadmap} onClick={() => setMobileMenuOpen(false)} />
                    <MobileNavLink href="/pricing" label={dictionary.navbar.pricing} onClick={() => setMobileMenuOpen(false)} />
                    <MobileNavLink href="/docs" label={dictionary.navbar.academy} onClick={() => setMobileMenuOpen(false)} />

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
                            className="block w-full text-center rounded-2xl bg-emerald-600 px-6 py-4 text-white font-black uppercase tracking-widest text-xs hover:bg-emerald-700"
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
                "inline-flex items-center gap-1 whitespace-nowrap py-2 text-[12px] font-black uppercase tracking-[0.14em] transition-all",
                solid ? "text-slate-700 hover:text-slate-950" : "text-slate-700 hover:text-slate-950"
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
