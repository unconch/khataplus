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
  role?: string
  pathPrefix?: string
}

import { createClient } from "@/lib/supabase/client"
import { SettingsIcon } from "lucide-react"
import { useTenant } from "@/components/tenant-provider"
import { useState, useEffect } from "react"
import type { User } from "@supabase/supabase-js"

export function AppHeader({ profile, orgName, role: currentRole, pathPrefix = "" }: AppHeaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [isUserLoading, setIsUserLoading] = useState(true)
  const { tenant } = useTenant()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setIsUserLoading(false)
    }
    getUser()
  }, [supabase])

  const currentOrgName = tenant?.name || orgName || "KhataPlus"

  const displayName = profile?.name ||
    user?.email ||
    (!isUserLoading ? "Guest User" : "Loading...")

  const displayRole = currentRole || profile?.role || ""

  const formattedRole = displayRole === "main admin" ? "Main Admin" :
    displayRole === "owner" ? "Owner" :
      displayRole === "staff" ? "Staff" :
        displayRole || "Viewer"

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  const { isOnline, isStandalone } = usePWA()

  const handleLogoClick = () => {
    router.push("/")
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
          </div>
        </button>

        <div className="flex items-center gap-2 lg:gap-5">
          <div className="flex items-center">
            {/* Desktop-only detailed status */}

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
