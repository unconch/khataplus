"use client"

import type React from "react"

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
}

import { DesktopSidebar } from "@/components/desktop-sidebar"

export function AppShell({ children, profile, role, settings, orgId, orgName }: AppShellProps) {
  const isAdmin = role === "admin" || role === "main admin"

  return (
    <PWAProvider>
      <PWABadgeManager isAdmin={isAdmin} />

      <div className="flex min-h-svh bg-background text-foreground overflow-hidden selection:bg-primary/10 selection:text-primary">

        {/* Desktop Sidebar: Visible only on lg+ */}
        <DesktopSidebar role={role} settings={settings} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-svh overflow-hidden relative z-0">
          <AppHeader profile={profile} orgName={orgName} />

          <main className="flex-1 pb-32 lg:pb-12 p-4 lg:p-12 xl:p-16 2xl:p-20 overflow-auto gpu-layer relative scroll-smooth" style={{ contentVisibility: "auto" }}>
            <div className="mx-auto w-full max-w-[1800px] 2xl:max-w-[2000px] animate-in fade-in slide-in-from-bottom-4 duration-700">
              {children}
            </div>
          </main>
        </div>

        {/* Bottom Nav: Visible only on mobile */}
        <div className="lg:hidden">
          <BottomNav role={role} settings={settings} />
        </div>
      </div>

    </PWAProvider>
  )
}
