"use client"

import type React from "react"
import { useCallback, useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

import { SystemSettings, Profile } from "@/lib/types"
import { BottomNav } from "@/components/bottom-nav"
import { AppHeader } from "@/components/app-header"
import { PWAProvider } from "@/components/pwa-provider"
import { PWABadgeManager } from "@/components/pwa-badge-manager"
import { useMotion } from "@/components/motion-provider"
import { DashboardSkeleton, SalesPageSkeleton } from "@/components/skeletons"

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
  const { enableMotion } = useMotion()
  const [pendingNavigationHref, setPendingNavigationHref] = useState<string | null>(null)
  const isPosRoute = Boolean(pathname && pathname.includes("/pos"))

  const handleNavigationStart = useCallback((href: string) => {
    if (!href || href === pathname) return
    setPendingNavigationHref(href)
  }, [pathname])

  useEffect(() => {
    setPendingNavigationHref(null)
  }, [pathname])

  useEffect(() => {
    if (!pendingNavigationHref) return
    const timeoutId = window.setTimeout(() => setPendingNavigationHref(null), 4000)
    return () => window.clearTimeout(timeoutId)
  }, [pendingNavigationHref])

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return
      if (event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const target = event.target
      if (!(target instanceof Element)) return

      const anchor = target.closest("a[href]")
      if (!(anchor instanceof HTMLAnchorElement)) return
      if (anchor.target && anchor.target !== "_self") return
      if (anchor.hasAttribute("download")) return

      const rawHref = anchor.getAttribute("href")
      if (!rawHref || rawHref.startsWith("#")) return

      const resolvedHref = new URL(rawHref, window.location.href)
      if (resolvedHref.origin !== window.location.origin) return

      const nextPath = `${resolvedHref.pathname}${resolvedHref.search}`
      const currentPath = `${window.location.pathname}${window.location.search}`
      if (nextPath === currentPath) return

      handleNavigationStart(nextPath)
    }

    document.addEventListener("click", handleDocumentClick, true)
    return () => document.removeEventListener("click", handleDocumentClick, true)
  }, [handleNavigationStart])

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
        <div className="min-h-dvh bg-background text-foreground overflow-x-hidden selection:bg-primary/10 selection:text-primary">
          <main className="min-h-dvh w-full overflow-x-hidden overflow-y-auto md:h-dvh md:overflow-hidden">
            {children}
          </main>
        </div>
      </PWAProvider>
    )
  }

  return (
    <PWAProvider>
      <PWABadgeManager isAdmin={isAdmin} />

      <div className="flex min-h-dvh bg-background text-foreground overflow-hidden selection:bg-primary/10 selection:text-primary">

        {/* Desktop Sidebar: Visible only on lg+ */}
        <DesktopSidebar
          role={role}
          settings={settings}
          pathPrefix={pathPrefix}
          orgName={orgName}
          orgPlanType={orgPlanType}
          onNavigateStart={handleNavigationStart}
        />

        {/* Main Content Area */}
        <div className="relative z-0 flex min-h-dvh min-w-0 flex-1 flex-col overflow-hidden md:h-dvh">
          <AppHeader profile={profile} orgName={orgName} role={role} pathPrefix={pathPrefix} />

          <main
            className={`app-main-shell relative flex-1 overflow-y-auto overflow-x-hidden px-3 pt-0 pb-[calc(env(safe-area-inset-bottom)+6rem)] sm:px-4 lg:px-6 lg:pb-12 xl:px-8 2xl:px-10 ${enableMotion ? "scroll-smooth" : ""}`}
            style={{ contentVisibility: "auto" }}
          >
            {pendingNavigationHref && (
              <div className="absolute inset-0 z-20 overflow-auto bg-background/96 backdrop-blur-[2px]">
                {pendingNavigationHref.includes("/sales") ? <SalesPageSkeleton /> : <DashboardSkeleton />}
              </div>
            )}
            <div className={`${enableMotion ? "page-enter " : ""}mx-auto w-full max-w-7xl`}>
              {children}
            </div>
          </main>
        </div>

        {/* Bottom Nav: Visible only on mobile */}
        <div className="lg:hidden">
          <BottomNav
            role={role}
            settings={settings}
            pathPrefix={pathPrefix}
            orgPlanType={orgPlanType}
            onNavigateStart={handleNavigationStart}
          />
        </div>
      </div>

    </PWAProvider>
  )
}
