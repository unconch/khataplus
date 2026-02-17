"use client"

import Link from "next/link"
import { Home, Receipt, Box, Users, Settings } from "lucide-react"
import { SystemSettings, Profile } from "@/lib/types"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

type OrgRole = "admin" | "manager" | "staff"

interface BottomNavProps {
  role: OrgRole | Profile["role"]
  settings: SystemSettings
  pathPrefix?: string
}

export function BottomNav({ role, settings, pathPrefix = "" }: BottomNavProps) {
  const pathname = usePathname()

  const navItems = [
    { href: `${pathPrefix}/dashboard`, label: "Home", icon: Home },
    { href: `${pathPrefix}/dashboard/sales`, label: "Sales", icon: Receipt },
    { href: `${pathPrefix}/dashboard/inventory`, label: "Stock", icon: Box },
    { href: `${pathPrefix}/dashboard/customers`, label: "Ledger", icon: Users },
    { href: `${pathPrefix}/dashboard/settings`, label: "More", icon: Settings },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 h-auto">
      <div className="max-w-md mx-auto relative">
        <nav className="flex items-center justify-around glass-sharp rounded-[3rem] shadow-xl px-2 py-3">
          {navItems.map((item) => {
            const isAdmin = role === "admin" || role === "owner"
            const isStaff = role === "staff"

            // Filtering logic
            if (item.href.includes("/sales") && isStaff && !settings.allow_staff_sales) return null
            if (item.href.includes("/inventory") && isStaff && !settings.allow_staff_inventory) return null
            if (item.href.includes("/reports") && isStaff && !settings.allow_staff_reports) return null
            if (item.href.includes("/settings") && !isAdmin) return null

            const href = item.href
            const isHome = href === (pathPrefix ? `${pathPrefix}/dashboard` : "/dashboard")
            const isActive = isHome
              ? (pathname === href || pathname === (pathPrefix || "/"))
              : pathname.startsWith(href)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition-all duration-300 relative group",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn(
                  "p-1 rounded-xl transition-all duration-300",
                  isActive && "bg-primary/10"
                )}>
                  <Icon className={cn("h-5 w-5", isActive ? "stroke-[2.5px]" : "stroke-2")} />
                </div>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-wider transition-all duration-300",
                  isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
