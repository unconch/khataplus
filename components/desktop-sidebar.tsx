"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { hasPlanFeature, type PlanFeature, getRequiredPlanForFeature, formatPlanLabel } from "@/lib/plan-features"
import {
    Home, BarChart3, Users, Settings, Package,
    FileText, BadgeIndianRupee, Database, ChevronRight,
    LayoutDashboard, ArrowRight, Lock
} from "lucide-react"
import { SystemSettings } from "@/lib/types"
import { Logo } from "@/components/ui/logo"

interface DesktopSidebarProps {
    role: string | undefined
    settings: SystemSettings
    className?: string
    pathPrefix?: string
    orgName?: string
    orgPlanType?: string
}

export function DesktopSidebar({ role, settings, className, pathPrefix = "", orgName, orgPlanType = "free" }: DesktopSidebarProps) {
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

    const navItems: Array<{
        href: string
        label: string
        icon: any
        show: boolean
        feature?: PlanFeature
    }> = [
            { href: `${pathPrefix}/dashboard`, label: "Dashboard", icon: LayoutDashboard, show: true },
            { href: `${pathPrefix}/dashboard/khata`, label: "Khata Rail", icon: Users, show: true },
            { href: `${pathPrefix}/dashboard/sales`, label: "Sales", icon: BadgeIndianRupee, show: isAdmin || settings.allow_staff_sales },
            { href: `${pathPrefix}/dashboard/inventory`, label: "Inventory", icon: Package, show: isAdmin || settings.allow_staff_inventory },
            { href: `${pathPrefix}/dashboard/analytics`, label: "Analytics", icon: BarChart3, show: isAdmin || settings.allow_staff_analytics, feature: "analytics_dashboard" },
            { href: `${pathPrefix}/dashboard/reports`, label: "Reports", icon: FileText, show: isAdmin || settings.allow_staff_reports, feature: "reports" },
            { href: `${pathPrefix}/dashboard/migration`, label: "Migration", icon: Database, show: isAdmin, feature: "migration_import" },
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

                    const isLocked = Boolean(item.feature && !hasPlanFeature(orgPlanType, item.feature))
                    const requiredPlan = item.feature ? formatPlanLabel(getRequiredPlanForFeature(item.feature)) : null

                    if (isLocked) {
                        return (
                            <div
                                key={item.href}
                                className="flex items-center justify-between px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
                            >
                                <div className="flex items-center gap-4">
                                    <item.icon className="h-4 w-4 text-zinc-400 dark:text-zinc-600" />
                                    <span>{item.label}</span>
                                </div>
                                <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                                    <Lock className="h-2.5 w-2.5" />
                                    {requiredPlan}
                                </span>
                            </div>
                        )
                    }

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
