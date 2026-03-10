"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { SystemSettings, Profile } from "@/lib/types"
import { BottomNav } from "@/components/bottom-nav"
import { AppHeader } from "@/components/app-header"
import { createClient } from "@/lib/supabase/client"

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
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const lastSyncedTenantRef = useRef<string>("")

  useEffect(() => {
    const slug = String(orgSlug || "").trim()
    if (!slug) return
    if (slug.toLowerCase() === "demo") return
    if (!pathname?.startsWith("/dashboard")) return
    const targetBase = `/${slug}${pathname}`
    const query = searchParams?.toString() || ""
    const target = query ? `${targetBase}?${query}` : targetBase
    router.replace(target)
  }, [orgSlug, pathname, router, searchParams])

  const normalizeRole = (value: OrgRole | Profile["role"] | undefined) => {
    if (!value) return ""
    if (value === "main admin") return "owner"
    return String(value)
  }

  useEffect(() => {
    const slug = String(orgSlug || "").trim()
    const orgIdValue = String(orgId || "").trim()
    if (!slug) return
    if (slug.toLowerCase() === "demo") return
    const roleValue = normalizeRole(role)
    const syncKey = `${slug}:${orgIdValue || ""}:${roleValue}`
    if (lastSyncedTenantRef.current === syncKey) return

    let active = true
    const syncActiveOrgSlug = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        const user = data?.user
        if (!active || !user) return
        const needsSlugUpdate = user.user_metadata?.active_org_slug !== slug
        const needsOrgIdUpdate = orgIdValue && user.user_metadata?.active_org_id !== orgIdValue
        const needsRoleUpdate = roleValue && user.user_metadata?.active_org_role !== roleValue
        if (!needsSlugUpdate && !needsOrgIdUpdate && !needsRoleUpdate) {
          lastSyncedTenantRef.current = syncKey
          return
        }
        const payload: Record<string, string> = { active_org_slug: slug }
        if (orgIdValue) {
          payload.active_org_id = orgIdValue
        }
        if (roleValue) {
          payload.active_org_role = roleValue
        }
        await supabase.auth.updateUser({ data: payload })
        lastSyncedTenantRef.current = syncKey
      } catch {
        // Best-effort only.
      }
    }

    void syncActiveOrgSlug()
    return () => {
      active = false
    }
  }, [orgSlug, orgId, role, supabase])

  return (

    <div className="flex min-h-svh bg-background text-foreground overflow-hidden selection:bg-primary/10 selection:text-primary">
      <div className="orbital-glow">
        <div className="orbital-blob orbital-blob-1" />
        <div className="orbital-blob orbital-blob-2" />
      </div>

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
  )
}
