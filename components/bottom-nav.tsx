"use client"

import Link from "next/link"
import { LayoutDashboard, BadgeIndianRupee, Package, Users, Settings, Lock } from "lucide-react"
import { SystemSettings, Profile } from "@/lib/types"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { hasPlanFeature, type PlanFeature } from "@/lib/plan-features"

type OrgRole = "admin" | "manager" | "staff"

interface BottomNavProps {
  role: OrgRole | Profile["role"]
  settings: SystemSettings
  pathPrefix?: string
  orgPlanType?: string
}

export function BottomNav({ role, settings, pathPrefix = "", orgPlanType = "free" }: BottomNavProps) {
  const pathname = usePathname()

  const navItems: Array<{ href: string; label: string; icon: any; feature?: PlanFeature }> = [
    { href: `${pathPrefix}/dashboard`, label: "CORE", icon: LayoutDashboard },
    { href: `${pathPrefix}/dashboard/sales`, label: "SALES", icon: BadgeIndianRupee },
    { href: `${pathPrefix}/dashboard/inventory`, label: "INVENTORY", icon: Package },
    { href: `${pathPrefix}/dashboard/customers`, label: "LEDGER", icon: Users },
    { href: `${pathPrefix}/dashboard/settings`, label: "SETTINGS", icon: Settings },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-3 sm:px-6 pb-[env(safe-area-inset-bottom)] sm:pb-4">
      <div className="max-w-md mx-auto relative group">
        {/* Shadow Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-zinc-200 via-zinc-400 to-zinc-200 rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />

        <nav className="relative flex items-center justify-between bg-white border border-zinc-100 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-2">
          {navItems.map((item) => {
            const isAdmin = role === "admin" || role === "owner"
            const isStaff = role === "staff"

            // Filtering logic
            if (item.href.includes("/sales") && isStaff && !settings.allow_staff_sales) return null
            if (item.href.includes("/inventory") && isStaff && !settings.allow_staff_inventory) return null
            if (item.href.includes("/settings") && !isAdmin) return null
            if (item.feature && !hasPlanFeature(orgPlanType, item.feature)) {
              return (
                <div
                  key={item.href}
                  className="flex-1 min-w-0 flex flex-col items-center gap-1.5 px-2 py-2 rounded-2xl text-zinc-300 dark:text-zinc-700"
                >
                  <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900">
                    <Lock size={16} />
                  </div>
                  <span className="h-3 text-[8px] leading-none font-black uppercase tracking-[0.08em] opacity-100">
                    {item.label}
                  </span>
                </div>
              )
            }

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
                  "flex-1 min-w-0 flex flex-col items-center gap-1.5 px-2 py-2 rounded-2xl transition-all duration-500 relative",
                  isActive ? "text-zinc-950 scale-105" : "text-zinc-400 hover:text-zinc-600"
                )}
              >
                <div className={cn(
                  "p-2 rounded-xl transition-all duration-500",
                  isActive ? "bg-zinc-950 text-white shadow-lg shadow-zinc-200" : "bg-transparent"
                )}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>

                <span className={cn(
                  "h-3 text-[8px] leading-none font-black uppercase tracking-[0.08em] whitespace-nowrap transition-all duration-500",
                  isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"
                )}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
