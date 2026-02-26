"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    Home, BarChart3, Users, Settings, Package,
    FileText, BadgeIndianRupee, Database, ChevronRight,
    LayoutDashboard, ArrowRight
} from "lucide-react"
import { SystemSettings } from "@/lib/types"
import { Logo } from "@/components/ui/logo"

interface DesktopSidebarProps {
    role: string | undefined
    settings: SystemSettings
    className?: string
    pathPrefix?: string
    orgName?: string
}

export function DesktopSidebar({ role, settings, className, pathPrefix = "", orgName }: DesktopSidebarProps) {
    const pathname = usePathname()
    const isAdmin = role === "admin" || role === "main admin" || role === "owner"
    const normalizedPath = (() => {
        if (pathPrefix && pathname.startsWith(pathPrefix)) {
            const stripped = pathname.slice(pathPrefix.length)
            return stripped || "/"
        }
        // Fallback: when slugged path is visible but pathPrefix is not passed,
        // normalize `/org-slug/dashboard/...` -> `/dashboard/...` for active checks.
        const sluggedMatch = pathname.match(/^\/[^/]+(\/dashboard(?:\/.*)?$)/)
        if (sluggedMatch?.[1]) {
            return sluggedMatch[1]
        }
        return pathname
    })()

    const navItems = [
        { href: `${pathPrefix}/dashboard`, label: "Dashboard", icon: LayoutDashboard, show: true },
        { href: `${pathPrefix}/dashboard/khata`, label: "Khata Rail", icon: Users, show: true },
        { href: `${pathPrefix}/dashboard/sales`, label: "Sales", icon: BadgeIndianRupee, show: isAdmin || settings.allow_staff_sales },
        { href: `${pathPrefix}/dashboard/inventory`, label: "Inventory", icon: Package, show: isAdmin || settings.allow_staff_inventory },
        { href: `${pathPrefix}/dashboard/analytics`, label: "Analytics", icon: BarChart3, show: isAdmin || settings.allow_staff_analytics },
        { href: `${pathPrefix}/dashboard/reports`, label: "Reports", icon: FileText, show: isAdmin || settings.allow_staff_reports },
        { href: `${pathPrefix}/dashboard/migration`, label: "Migration", icon: Database, show: isAdmin },
        { href: `${pathPrefix}/dashboard/settings`, label: "Settings", icon: Settings, show: isAdmin },
    ]

    return (
        <aside className={cn("hidden lg:flex flex-col w-[260px] border-r border-zinc-100 dark:border-white/10 bg-white dark:bg-zinc-950 h-svh sticky top-0 transition-all duration-500 z-50", className)}>
            <div className="p-8 pb-10">
                <div
                    className="flex flex-col gap-6 group cursor-pointer"
                    onClick={() => window.location.href = "/"}
                >
                    <div className="flex items-center gap-4">
                        <div className="shrink-0 group-hover:scale-110 transition-all duration-500">
                            <Logo size={48} />
                        </div>
                        <div className="flex flex-col justify-center">
                            <h1 className="text-2xl font-black text-zinc-950 dark:text-zinc-100 leading-none tracking-tight transition-all duration-300 group-hover:tracking-tighter">
                                KhataPlus
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 mb-6">
                <div className="h-px bg-gradient-to-r from-zinc-100 dark:from-white/10 via-zinc-100 dark:via-white/10 to-transparent w-full" />
            </div>

            <nav className="flex-1 px-4 space-y-1.5">
                <div className="px-6 mb-4">
                    <p className="text-[9px] font-black text-zinc-300 dark:text-zinc-600 uppercase tracking-[0.3em]">Operational Flow</p>
                </div>

                {navItems.filter(item => item.show).map((item, idx) => {
                    const isHome = item.href === (pathPrefix ? `${pathPrefix}/dashboard` : "/dashboard")
                    const normalizedItemHref = pathPrefix && item.href.startsWith(pathPrefix)
                        ? (item.href.slice(pathPrefix.length) || "/")
                        : item.href
                    const isActive = isHome
                        ? (normalizedPath === "/dashboard" || normalizedPath === "/")
                        : normalizedPath.startsWith(normalizedItemHref)

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center justify-between px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all group relative border border-transparent animate-in fade-in slide-up",
                                isActive
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 shadow-sm"
                                    : "text-zinc-400 dark:text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-950 dark:hover:text-zinc-100",
                                idx === 0 ? "stagger-1" :
                                    idx === 1 ? "stagger-2" :
                                        idx === 2 ? "stagger-3" :
                                            idx === 3 ? "stagger-4" : "stagger-5"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <item.icon className={cn("h-4 w-4 transition-transform", isActive ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-950 dark:group-hover:text-zinc-100")} />
                                <span>{item.label}</span>
                            </div>

                            {isActive && (
                                <ChevronRight className="h-3 w-3 text-emerald-600/40 dark:text-emerald-400/40" />
                            )}

                            {!isActive && (
                                <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-zinc-300 dark:text-zinc-600" />
                            )}
                        </Link>
                    )
                })}
            </nav>
        </aside>
    )
}
