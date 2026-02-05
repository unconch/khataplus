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

import { useDescope, useUser } from "@descope/nextjs-sdk/client"
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
    (user as any)?.givenName ||
    (user as any)?.given_name ||
    (user as any)?.fullName ||
    profile?.email ||
    user?.email ||
    (user as any)?.loginId ||
    (isUserLoading ? "Loading..." : "Guest User")

  const displayRole = profile?.role ||
    (user as any)?.roles?.[0] ||
    ((user as any)?.roleNames?.[0]) ||
    ""

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
    // On PWA (standalone mode), go to home. On web browser, go to marketing page
    if (isStandalone) {
      router.push("/home")
    } else {
      router.push("/")
    }
  }

  return (
    <header className="sticky top-0 z-40 glass border-b border-border/50 shadow-sm">
      <div className="flex h-14 items-center justify-between px-4">
        <button onClick={handleLogoClick} className="flex items-center gap-3 group cursor-pointer text-left">
          {tenant?.logo_url ? (
            <img src={tenant.logo_url} alt={tenant.name} className="h-8 w-8 object-contain rounded-lg" />
          ) : (
            <Logo size={32} className="text-primary transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3" />
          )}
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-tighter text-foreground leading-none">
              {currentOrgName}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={cn(
                "h-1.5 w-1.5 rounded-full",
                isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-destructive animate-pulse"
              )} />
              <span className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground/70">
                {isOnline ? "Secure Sync Active" : "Offline Mode"}
              </span>
            </div>
          </div>
        </button>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-medium text-foreground">{displayName}</p>
            <p className="text-xs text-muted-foreground">{formattedRole}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <UserIcon className="h-5 w-5" />
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">{formattedRole}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/home/settings")}>
                <Building2 className="mr-2 h-4 w-4" />
                Organization
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/home/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOutIcon className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
