"use client"

import type React from "react"
import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

import { SystemSettings, Profile } from "@/lib/types"
import { BottomNav } from "@/components/bottom-nav"
import { AppHeader } from "@/components/app-header"
import { PWAProvider } from "@/components/pwa-provider"
import { PWABadgeManager } from "@/components/pwa-badge-manager"

type OrgRole = "admin" | "manager" | "staff"

interface AppShellProps {
  children: React.ReactNode
  profile: Profile | null
  role: OrgRole | Profile["role"]
  settings: SystemSettings
  orgId?: string
  orgName?: string
  orgSlug?: string
  orgPlanType?: string
  pathPrefix?: string
}

import { DesktopSidebar } from "@/components/desktop-sidebar"

export function AppShell({ children, profile, role, settings, orgId, orgName, orgSlug, orgPlanType, pathPrefix = "" }: AppShellProps) {
  const isAdmin = role === "admin" || role === "main admin"
  const isDemoShell = orgId === "demo-org"
  const router = useRouter()
  const pathname = usePathname()
  const isPosRoute = Boolean(pathname && pathname.includes("/pos"))

  useEffect(() => {
    if (isDemoShell) return
    const slug = String(orgSlug || "").trim()
    if (!slug || slug === "undefined" || slug === "null") return
    if (!pathname?.startsWith("/dashboard")) return
    const targetBase = `/app/${slug}${pathname}`
    const query = typeof window !== "undefined" ? window.location.search.replace(/^\?/, "") : ""
    const target = query ? `${targetBase}?${query}` : targetBase
    router.replace(target)
  }, [isDemoShell, orgSlug, pathname, router])

  if (isPosRoute) {
    return (
      <PWAProvider>
        <PWABadgeManager isAdmin={isAdmin} />
        <div className="min-h-svh bg-background text-foreground overflow-hidden selection:bg-primary/10 selection:text-primary">
          <main className="h-svh w-full overflow-hidden">
            {children}
          </main>
        </div>
      </PWAProvider>
    )
  }

  return (
    <PWAProvider>
      <PWABadgeManager isAdmin={isAdmin} />

      <div className="flex min-h-svh bg-background text-foreground overflow-hidden selection:bg-primary/10 selection:text-primary">

        {/* Desktop Sidebar: Visible only on lg+ */}
        <DesktopSidebar role={role} settings={settings} pathPrefix={pathPrefix} orgName={orgName} orgPlanType={orgPlanType} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-svh overflow-hidden relative z-0">
          <AppHeader profile={profile} orgName={orgName} role={role} pathPrefix={pathPrefix} />

          <main className="flex-1 pb-24 lg:pb-12 px-3 sm:px-4 lg:px-6 xl:px-8 2xl:px-10 pt-0 overflow-auto gpu-layer relative scroll-smooth" style={{ contentVisibility: "auto" }}>
            <div className="mx-auto w-full max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
              {children}
            </div>
          </main>
        </div>

        {/* Bottom Nav: Visible only on mobile */}
        <div className="lg:hidden">
          <BottomNav role={role} settings={settings} pathPrefix={pathPrefix} orgPlanType={orgPlanType} />
        </div>
      </div>

    </PWAProvider>
  )
}
