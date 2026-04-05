"use client"

import { LayoutDashboard, BadgeIndianRupee, Package, Users, Settings } from "lucide-react"
import { SystemSettings, Profile } from "@/lib/types"
import { cn } from "@/lib/utils"
import { usePathname, useRouter } from "next/navigation"
import { hasPlanFeature, type PlanFeature } from "@/lib/plan-features"

type OrgRole = "admin" | "manager" | "staff"

interface BottomNavProps {
  role: OrgRole | Profile["role"]
  settings: SystemSettings
  pathPrefix?: string
  orgPlanType?: string
  onNavigateStart?: (href: string) => void
}

export function BottomNav({ role, settings, pathPrefix = "", orgPlanType = "free", onNavigateStart }: BottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  const navItems: Array<{ href: string; label: string; icon: any; feature?: PlanFeature }> = [
    { href: `${pathPrefix}/dashboard`, label: "HOME", icon: LayoutDashboard },
    { href: `${pathPrefix}/dashboard/sales`, label: "SALES", icon: BadgeIndianRupee },
    { href: `${pathPrefix}/dashboard/inventory`, label: "ITEMS", icon: Package },
    { href: `${pathPrefix}/dashboard/customers`, label: "KHATA", icon: Users },
    { href: `${pathPrefix}/dashboard/settings`, label: "SETTINGS", icon: Settings },
  ]

  const visibleNavItems = navItems.filter((item) => {
    const isAdmin = role === "admin" || role === "owner"
    const isStaff = role === "staff"

    if (item.href.includes("/sales") && isStaff && !settings.allow_staff_sales) return false
    if (item.href.includes("/inventory") && isStaff && !settings.allow_staff_inventory) return false
    if (item.href.includes("/settings") && !isAdmin) return false
    if (item.feature && !hasPlanFeature(orgPlanType, item.feature)) return false

    return true
  })

  return (
    <div className="app-bottom-nav-shell fixed bottom-0 left-0 right-0 z-50 px-2 pb-[calc(env(safe-area-inset-bottom)+8px)] sm:px-6 sm:pb-4">
      <div className="max-w-md mx-auto relative group pointer-events-none">
        {/* Shadow Glow */}
        <div className="app-bottom-nav-glow pointer-events-none absolute inset-x-4 -top-2 bottom-1 rounded-full bg-gradient-to-r from-zinc-200/70 via-zinc-300 to-zinc-200/70 opacity-60 blur-2xl transition-opacity group-hover:opacity-80 dark:from-emerald-500/10 dark:via-cyan-400/12 dark:to-transparent dark:opacity-100" />

        <nav
          className="app-bottom-nav pointer-events-auto relative grid items-stretch rounded-[1.75rem] border border-zinc-200/80 bg-white/96 p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.12)] backdrop-blur-xl dark:border-white/8 dark:bg-[rgba(15,23,42,0.92)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
          style={{ gridTemplateColumns: `repeat(${visibleNavItems.length}, minmax(0, 1fr))` }}
        >
          {visibleNavItems.map((item) => {
            const itemKey = `${item.label}-${item.href}`

            const href = item.href
            const isHome = href === (pathPrefix ? `${pathPrefix}/dashboard` : "/dashboard")
            const isActive = isHome
              ? (pathname === href || pathname === (pathPrefix || "/"))
              : pathname.startsWith(href)
            const Icon = item.icon
            const isSalesTab = item.label === "SALES"

            return (
                <button
                  key={itemKey}
                  type="button"
                  onClick={() => {
                    onNavigateStart?.(href)
                    router.push(href)
                  }}
                aria-label={item.label}
                className={cn(
                  "relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-[1.2rem] px-1 py-2.5 transition-all duration-200 cursor-pointer touch-manipulation",
                  isActive
                    ? cn(
                        "text-zinc-950 dark:text-white",
                        isSalesTab && "dark:text-amber-200"
                      )
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                )}
              >
                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200",
                  isActive
                    ? cn(
                        "bg-zinc-950 text-white dark:bg-emerald-400 dark:text-slate-950",
                        isSalesTab && "dark:bg-amber-400/90 dark:text-slate-950"
                      )
                    : "bg-transparent"
                )}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>

                <span className={cn(
                  "min-h-[10px] text-[7px] leading-none font-black uppercase tracking-[0.12em] whitespace-nowrap transition-colors duration-200",
                  isActive
                    ? cn("text-zinc-950 dark:text-white", isSalesTab && "dark:text-amber-200")
                    : "text-zinc-500 dark:text-zinc-400"
                )}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
