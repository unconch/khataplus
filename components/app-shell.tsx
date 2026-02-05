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

      {/* Container: Flex Row for Desktop (Sidebar | Content), Flex Col for Mobile (Header / Content / Nav) */}
      <div className="flex min-h-svh bg-background text-foreground">

        {/* Desktop Sidebar: Visible only on md+ */}
        <DesktopSidebar role={role} settings={settings} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader profile={profile} orgName={orgName} />

          <main className="flex-1 pb-24 md:pb-8 p-4 md:p-8 overflow-auto gpu-layer relative" style={{ contentVisibility: "auto" }}>
            {children}
          </main>
        </div>

        {/* Bottom Nav: Visible only on mobile */}
        <div className="md:hidden">
          <BottomNav role={role} settings={settings} />
        </div>
      </div>
    </PWAProvider>
  )
}
