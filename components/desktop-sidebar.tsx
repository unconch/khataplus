"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, BarChart3, Users, Settings, Package, FileText, BadgeIndianRupee } from "lucide-react"
import { SystemSettings } from "@/lib/types"

interface DesktopSidebarProps {
    role: string | undefined
    settings: SystemSettings
    className?: string
    pathPrefix?: string
}

export function DesktopSidebar({ role, settings, className, pathPrefix = "" }: DesktopSidebarProps) {
    const pathname = usePathname()
    console.log(`--- [DEBUG] DesktopSidebar: pathname=${pathname} role=${role} prefix=${pathPrefix} ---`)

    const isAdmin = role === "admin" || role === "main admin" || role === "owner"

    const navItems = [
        { href: `${pathPrefix}/dashboard`, label: "Home", icon: Home, show: true },
        { href: `${pathPrefix}/dashboard/sales`, label: "Sales", icon: BadgeIndianRupee, show: isAdmin || settings.allow_staff_sales },
        { href: `${pathPrefix}/dashboard/inventory`, label: "Inventory", icon: Package, show: isAdmin || settings.allow_staff_inventory },
        { href: `${pathPrefix}/dashboard/analytics`, label: "Analytics", icon: BarChart3, show: isAdmin || settings.allow_staff_analytics },
        { href: `${pathPrefix}/dashboard/reports`, label: "Reports", icon: FileText, show: isAdmin || settings.allow_staff_reports },
        { href: `${pathPrefix}/dashboard/settings`, label: "Organization", icon: Users, show: isAdmin },
    ]

    return (
        <aside className={cn("hidden lg:flex flex-col w-80 border-r border-border/40 bg-card/20 backdrop-blur-3xl h-svh sticky top-0 transition-all duration-500 ease-in-out z-40", className)}>
            <div className="p-10">
                <div
                    className="flex items-center gap-4 group cursor-pointer"
                    onClick={() => window.location.href = "/dashboard"}
                >
                    <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/30 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                        <span className="text-primary-foreground font-black text-lg tracking-tighter">KP</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60">KhataPlus</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/70">Platinum</span>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-6 space-y-2 mt-4">
                {navItems.filter(item => item.show).map((item) => {
                    // Exact match for the root dashboard link, startsWith for sub-pages
                    // Exact match for the root dashboard link, or matching the base path prefix
                    const isHome = item.href === (pathPrefix ? `${pathPrefix}/dashboard` : "/dashboard")
                    const isActive = isHome
                        ? (pathname === item.href || pathname === (pathPrefix || "/"))
                        : pathname.startsWith(item.href)

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-4 px-5 py-4 rounded-2xl text-[15px] font-bold transition-all duration-300 group relative",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-[1.02]"
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:translate-x-1"
                            )}
                        >
                            <item.icon className={cn("h-[20px] w-[20px] transition-transform duration-300 group-hover:scale-110", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                            <span className="tracking-tight">{item.label}</span>
                            {isActive && (
                                <div className="absolute inset-y-3 left-0 w-1.5 bg-white/30 rounded-r-full animate-in fade-in slide-in-from-left-2 duration-500" />
                            )}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-8">
                <div className="relative group overflow-hidden p-6 bg-gradient-to-br from-primary/10 to-transparent border border-primary/10 rounded-3xl space-y-3 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5">
                    <div className="absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                    <div className="flex items-center justify-between relative z-10">
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">System Status</p>
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    </div>
                    <p className="text-xs font-bold text-foreground/80 leading-relaxed relative z-10">
                        Enterprise Grade <br />
                        Retail Infrastructure
                    </p>
                </div>
            </div>
        </aside>
    )
}
