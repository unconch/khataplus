"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
    Menu, X, ArrowRight, LogOut, User
} from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { cn } from "@/lib/utils"
import { useMainAuthUrls } from "@/hooks/use-main-auth-urls"

interface NavbarProps {
    isAuthenticated: boolean
    isLight?: boolean
    lightMode?: boolean
    orgSlug?: string | null
    isGuest?: boolean
    userName?: string | null
    orgName?: string | null
}

type AuthContext = {
    isAuthenticated: boolean
    isGuest?: boolean
    orgSlug?: string | null
    userName?: string | null
    orgName?: string | null
}

export function Navbar({ isAuthenticated, isLight = false, lightMode = false, orgSlug, isGuest, userName, orgName }: NavbarProps) {
    const [scrolled, setScrolled] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const [authContext, setAuthContext] = useState<AuthContext>({
        isAuthenticated,
        isGuest,
        orgSlug,
        userName,
        orgName,
    })
    const scrolledRef = useRef(false)
    const rafRef = useRef<number | null>(null)
    const userMenuRef = useRef<HTMLDivElement | null>(null)
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

    useEffect(() => {
        if (!userMenuOpen) return
        const onClick = (event: MouseEvent) => {
            if (!userMenuRef.current) return
            if (!userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false)
            }
        }
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") setUserMenuOpen(false)
        }
        document.addEventListener("click", onClick)
        document.addEventListener("keydown", onKey)
        return () => {
            document.removeEventListener("click", onClick)
            document.removeEventListener("keydown", onKey)
        }
    }, [userMenuOpen])

    useEffect(() => {
        const controller = new AbortController()
        const loadContext = async () => {
            try {
                const res = await fetch("/api/auth/context", { signal: controller.signal, cache: "no-store" })
                if (!res.ok) return
                const data = await res.json()
                setAuthContext((prev) => ({
                    ...prev,
                    ...data,
                }))
            } catch { }
        }

        void loadContext()
        return () => controller.abort()
    }, [])

    const isSolid = isLight || lightMode || scrolled || mobileMenuOpen
    const keepBlended = !(isLight || lightMode)
    const useSolidPalette = !keepBlended && isSolid

    const effectiveAuth = authContext.isAuthenticated
    const effectiveOrgSlug = authContext.orgSlug || orgSlug
    const displayName = authContext.userName || userName || "User"
    const displayOrg = authContext.orgName || orgName || "Workspace"

    const primaryHref = effectiveAuth
        ? (effectiveOrgSlug ? `/${effectiveOrgSlug}/dashboard` : "/dashboard")
        : signUpUrl
    const primaryLabel = effectiveAuth
        ? "Dashboard"
        : "Start Free Trial"
    const secondaryHref = effectiveAuth
        ? (effectiveOrgSlug ? `/${effectiveOrgSlug}/settings/profile` : "/settings/profile")
        : signInUrl
    const secondaryLabel = effectiveAuth
        ? "Settings"
        : "Sign In"

    const initials = displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "U"

    return (
        <header className="fixed top-0 left-0 right-0 z-50">
            <div
                className={cn(
                    "transition-all duration-500 backdrop-blur-xl",
                    keepBlended
                        ? "bg-[linear-gradient(90deg,rgba(16,185,129,0.18)_0%,rgba(51,65,85,0.24)_58%,rgba(30,41,59,0.18)_100%)] border border-white/10"
                        : "bg-white/70 border-b border-white/30",
                    "mx-0 mt-0 rounded-none border-x-0"
                )}
            >
                <div className="w-full px-4 md:px-6">
                    <div className="relative h-12 md:h-16 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-3">
                            <Logo size={42} className="text-emerald-600" />
                            <span className={cn("text-2xl font-black tracking-tighter italic", useSolidPalette ? "text-slate-900" : "text-white")}>
                                KhataPlus
                            </span>
                        </Link>

                        <nav className="hidden md:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
                            <DesktopNavLink href="/features" label="Features" solid={useSolidPalette} />
                            <DesktopNavLink href="/roadmap" label="Roadmap" solid={useSolidPalette} />
                            <DesktopNavLink href="/pricing" label="Pricing" solid={useSolidPalette} />
                            <DesktopNavLink href="/docs" label="Merchant Academy" solid={useSolidPalette} />
                        </nav>

                        <div className="hidden md:flex items-center gap-4">
                            {effectiveAuth ? (
                                <>
                                    <Link
                                        href={primaryHref}
                                        className={cn(
                                            "px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                            useSolidPalette
                                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                                : "bg-white text-slate-900 hover:bg-slate-100"
                                        )}
                                    >
                                        {primaryLabel}
                                    </Link>
                                    <div className="relative" ref={userMenuRef}>
                                        <button
                                            type="button"
                                            onClick={() => setUserMenuOpen((prev) => !prev)}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2 rounded-xl border transition-all",
                                                useSolidPalette
                                                    ? "border-slate-200/80 bg-white/60 text-slate-900 hover:bg-white"
                                                    : "border-white/15 bg-white/10 text-white hover:bg-white/15"
                                            )}
                                            aria-haspopup="menu"
                                            aria-expanded={userMenuOpen}
                                        >
                                            <span className={cn(
                                                "h-9 w-9 rounded-lg flex items-center justify-center font-black text-[11px]",
                                                useSolidPalette ? "bg-emerald-600 text-white" : "bg-white text-slate-900"
                                            )}>
                                                {initials}
                                            </span>
                                            <span className="flex flex-col leading-tight text-left">
                                                <span className="text-[11px] font-black tracking-tight">{displayName}</span>
                                                <span className={cn("text-[9px] font-bold uppercase tracking-widest", useSolidPalette ? "text-slate-500" : "text-white/60")}>
                                                    {displayOrg}
                                                </span>
                                            </span>
                                        </button>
                                        {userMenuOpen && (
                                            <div
                                                role="menu"
                                                className={cn(
                                                    "absolute right-0 mt-3 min-w-[240px] rounded-2xl border shadow-2xl overflow-hidden",
                                                    useSolidPalette
                                                        ? "bg-white border-slate-200/80 text-slate-900"
                                                        : "bg-[#131418] border-white/10 text-white"
                                                )}
                                            >
                                                <div className="px-4 py-3">
                                                    <div className={cn(
                                                        "flex items-center gap-3 rounded-xl px-3 py-2",
                                                        useSolidPalette ? "bg-slate-50" : "bg-white/5"
                                                    )}>
                                                        <span className={cn(
                                                            "h-9 w-9 rounded-lg flex items-center justify-center font-black text-[11px]",
                                                            useSolidPalette ? "bg-emerald-600 text-white" : "bg-white text-slate-900"
                                                        )}>
                                                            {initials}
                                                        </span>
                                                        <div className="flex flex-col leading-tight">
                                                            <span className="text-[12px] font-black tracking-tight">{displayName}</span>
                                                            <span className={cn("text-[10px] font-bold uppercase tracking-widest", useSolidPalette ? "text-slate-500" : "text-white/60")}>
                                                                {displayOrg}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className={cn("h-px", useSolidPalette ? "bg-slate-200/80" : "bg-white/10")} />

                                                <Link
                                                    href={secondaryHref}
                                                    className={cn(
                                                        "flex items-center gap-2 px-4 py-3 text-[11px] font-black uppercase tracking-widest transition-colors",
                                                        useSolidPalette ? "hover:bg-slate-50" : "hover:bg-white/10"
                                                    )}
                                                    role="menuitem"
                                                >
                                                    <User className="h-4 w-4" />
                                                    {secondaryLabel}
                                                </Link>

                                                <div className={cn("h-px", useSolidPalette ? "bg-slate-200/80" : "bg-white/10")} />

                                                <Link
                                                    href="/api/auth/logout"
                                                    className={cn(
                                                        "flex items-center gap-2 px-4 py-3 text-[11px] font-black uppercase tracking-widest transition-colors",
                                                        useSolidPalette ? "hover:bg-slate-50 text-red-600" : "hover:bg-white/10 text-red-400"
                                                    )}
                                                    role="menuitem"
                                                >
                                                    <LogOut className="h-4 w-4" />
                                                    Logout
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href={secondaryHref}
                                        className={cn(
                                            "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                            useSolidPalette
                                                ? "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                                                : "text-white/90 hover:text-white hover:bg-white/10"
                                        )}
                                    >
                                        {secondaryLabel}
                                    </Link>
                                    <Link
                                        href={primaryHref}
                                        className={cn(
                                            "px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                            useSolidPalette
                                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                                : "bg-white text-slate-900 hover:bg-slate-100"
                                        )}
                                    >
                                        {primaryLabel}
                                    </Link>
                                </>
                            )}
                        </div>

                        <button
                            className={cn("md:hidden p-2 -mr-2 transition-colors", useSolidPalette ? "text-slate-900" : "text-white")}
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
                    <MobileNavLink href="/roadmap" label="Roadmap" onClick={() => setMobileMenuOpen(false)} />
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
