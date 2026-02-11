"use client"

import type { Profile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOutIcon, UserIcon, WifiIcon, WifiOffIcon, Building2, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { Logo, LogoText } from "@/components/ui/logo"
import { usePWA } from "@/components/pwa-provider"
import { cn } from "@/lib/utils"

interface AppHeaderProps {
  profile: Profile | null
  orgName?: string
}

import { useDescope, useUser } from "@descope/react-sdk"
import { SettingsIcon } from "lucide-react"
import { useTenant } from "@/components/tenant-provider"

export function AppHeader({ profile, orgName }: AppHeaderProps) {
  const router = useRouter()
  const { logout } = useDescope()
  const { user, isUserLoading } = useUser()
  const { tenant } = useTenant()

  const currentOrgName = tenant?.name || orgName || "Platinum"

  const displayName = profile?.name ||
    user?.name ||
    profile?.email ||
    user?.email ||
    (!isUserLoading ? "Guest User" : "Loading...")

  const displayRole = profile?.role || ""

  const formattedRole = displayRole === "main admin" ? "Main Admin" :
    displayRole === "owner" ? "Owner" :
      displayRole === "staff" ? "Staff" :
        displayRole || "Viewer"

  const handleLogout = async () => {
    await logout()
    router.push("/auth/login")
    router.refresh()
  }

  const { isOnline, isStandalone } = usePWA()

  const handleLogoClick = () => {
    if (isStandalone) {
      router.push("/dashboard")
    } else {
      router.push("/")
    }
  }

  return (
    <header className="sticky top-0 z-40 glass-sharp shadow-sm border-b">
      <div className="flex h-14 items-center justify-between px-4 lg:px-8">
        <button onClick={handleLogoClick} className="flex items-center gap-3 group cursor-pointer text-left">
          {tenant?.logo_url ? (
            <img src={tenant.logo_url} alt={tenant.name} className="h-8 w-8 lg:h-10 lg:w-10 object-contain rounded-xl shadow-sm" />
          ) : (
            <Logo size={28} className="text-primary transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3" />
          )}
          <div className="flex flex-col">
            <span className="text-sm lg:text-base font-black tracking-tighter text-foreground leading-none">
              {currentOrgName}
            </span>
            <div className="flex items-center gap-1 mt-1">
              <span className={cn(
                "h-1.5 w-1.5 rounded-full",
                isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-destructive animate-pulse"
              )} />
              <span className="text-[9px] font-black uppercase tracking-[0.05em] text-muted-foreground/80">
                {isOnline ? "Sync Active" : "Offline"}
              </span>
            </div>
          </div>
        </button>

        <div className="flex items-center gap-2 lg:gap-5">
          <div className="flex items-center">
            {/* Desktop-only detailed status */}
            <div className="mr-3 hidden lg:flex items-center border-r border-border/40 pr-4">
              <span className={cn(
                "h-2 w-2 rounded-full",
                isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-destructive animate-pulse"
              )} />
              <div className="ml-2 text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-emerald-600">
                  {isOnline ? "Realtime Active" : "Offline"}
                </p>
              </div>
            </div>

            <div className="text-right hidden sm:block mr-2 lg:mr-4 border-r border-border/40 pr-2 lg:pr-4">
              <p className="text-xs lg:text-sm font-bold text-foreground leading-none">{displayName}</p>
              <p className="text-[10px] lg:text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mt-1">{formattedRole}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 lg:gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-xl lg:rounded-2xl h-9 w-9 lg:h-11 lg:w-11 bg-secondary hover:bg-muted border border-border">
                  <UserIcon className="h-4 w-4 lg:h-5 lg:w-5" />
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl border-border/40 shadow-2xl">
                <div className="px-3 py-3 mb-2">
                  <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-1">Authenticated As</p>
                  <p className="text-base font-bold text-foreground">{displayName}</p>
                  <p className="text-xs font-semibold text-muted-foreground/70">{profile?.email || user?.email}</p>
                </div>
                <DropdownMenuSeparator className="opacity-40" />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive focus:bg-destructive/10 rounded-xl py-2.5 px-3">
                  <LogOutIcon className="mr-3 h-5 w-5" />
                  <span className="font-bold">Logout System</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>

  )
}
