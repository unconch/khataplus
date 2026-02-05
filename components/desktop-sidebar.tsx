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
}

export function DesktopSidebar({ role, settings, className }: DesktopSidebarProps) {
    const pathname = usePathname()

    const navItems = [
        { href: "/home", label: "Home", icon: Home, show: true },
        { href: "/home/sales", label: "Sales", icon: BadgeIndianRupee, show: role === "admin" || settings.allow_staff_sales },
        { href: "/home/inventory", label: "Inventory", icon: Package, show: role === "admin" || settings.allow_staff_inventory }, // Assuming inventory route exists or mapping it
        { href: "/home/analytics", label: "Analytics", icon: BarChart3, show: role === "admin" || settings.allow_staff_analytics },
        { href: "/home/reports", label: "Reports", icon: FileText, show: role === "admin" || settings.allow_staff_reports },
        { href: "/home/admin", label: "Admin", icon: Settings, show: role === "admin" }, // Admin only
    ]

    return (
        <aside className={cn("hidden md:flex flex-col w-64 border-r border-border bg-card/50 backdrop-blur-xl h-svh sticky top-0", className)}>
            <div className="p-6">
                <div className="flex items-center gap-2 font-black text-xl tracking-tighter">
                    <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                        <span className="text-primary-foreground text-xs">KP</span>
                    </div>
                    KhataPlus
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {navItems.filter(item => item.show).map((item) => {
                    const isActive = item.href === "/home"
                        ? pathname === "/home"
                        : pathname.startsWith(item.href)

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-md"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <item.icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                            {item.label}
                            {isActive && (
                                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/20" />
                            )}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-border">
                <div className="p-4 bg-muted/50 rounded-xl space-y-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pro Plan</p>
                    <p className="text-[10px] text-muted-foreground/60">Organization: KhataPlus</p>
                </div>
            </div>
        </aside>
    )
}
