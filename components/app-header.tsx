"use client"

import type { Profile } from "@/lib/types"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOutIcon, Building2, Bell, HardDrive, Sun, Moon, AlertTriangle, ShieldAlert, Info, CheckCircle2, RefreshCw } from "lucide-react"
import { useTheme } from "next-themes"
import { useTenant } from "@/components/tenant-provider"
import { cn } from "@/lib/utils"

interface AppHeaderProps {
  profile: Profile | null
  orgName?: string
  role?: string
  pathPrefix?: string
}

type HeaderNotification = {
  id: string
  kind: "warning" | "info" | "success" | "security"
  title: string
  message: string
  href?: string
  timestamp: string
}

export function AppHeader({ profile, orgName, role: currentRole, pathPrefix = "" }: AppHeaderProps) {
  const { tenant } = useTenant()
  const { theme, setTheme } = useTheme()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [notifications, setNotifications] = useState<HeaderNotification[]>([])
  const [readMap, setReadMap] = useState<Record<string, boolean>>({})

  const currentOrgName = tenant?.name || orgName || "KhataPlus"
  const orgId = String(tenant?.id || "global")
  const readStoreKey = `kp-notif-read:${orgId}`

  const displayName = profile?.name ||
    profile?.email?.split('@')[0] ||
    "Operator"

  const displayRole = currentRole || profile?.role || ""

  const formattedRole = displayRole === "main admin" ? "System Admin" :
    displayRole === "owner" ? "Primary Owner" :
      displayRole === "staff" ? "Associate" :
        displayRole || "Viewer"

  useEffect(() => {
    if (!notificationsOpen) return
    try {
      const raw = window.localStorage.getItem(readStoreKey)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === "object") setReadMap(parsed)
    } catch {
      // Ignore malformed local storage payload.
    }
  }, [notificationsOpen, readStoreKey])

  const persistReadMap = (next: Record<string, boolean>) => {
    setReadMap(next)
    try {
      window.localStorage.setItem(readStoreKey, JSON.stringify(next))
    } catch {
      // Best-effort persistence.
    }
  }

  const markNotificationRead = (id: string) => {
    if (!id) return
    persistReadMap({ ...readMap, [id]: true })
  }

  const markAllRead = () => {
    const next = { ...readMap }
    for (const n of notifications) next[n.id] = true
    persistReadMap(next)
  }

  const openNotificationHref = (href?: string) => {
    if (!href) return
    const isDashboardRoute = href.startsWith("/dashboard")
    const target = isDashboardRoute && pathPrefix ? `${pathPrefix}${href}` : href
    window.location.href = target
  }

  const loadNotifications = useCallback(async () => {
    setNotificationsLoading(true)
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to load notifications")
      setNotifications(Array.isArray(data?.notifications) ? data.notifications : [])
    } catch {
      setNotifications([])
    } finally {
      setNotificationsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!notificationsOpen) return
    void loadNotifications()
    const timer = window.setInterval(() => void loadNotifications(), 30000)
    return () => window.clearInterval(timer)
  }, [notificationsOpen])

  const unreadCount = useMemo(
    () => notifications.filter((n) => !readMap[n.id]).length,
    [notifications, readMap]
  )

  const iconForKind = (kind: HeaderNotification["kind"]) => {
    if (kind === "security") return <ShieldAlert className="h-4 w-4 text-rose-500" />
    if (kind === "warning") return <AlertTriangle className="h-4 w-4 text-amber-500" />
    if (kind === "success") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    return <Info className="h-4 w-4 text-sky-500" />
  }

  const handleLogout = async () => {
    window.location.href = "/api/auth/logout?returnTo=/auth/login"
  }

  useEffect(() => {
    if (!theme || typeof document === "undefined") return
    document.cookie = `kp_theme=${theme}; path=/; max-age=31536000; samesite=lax`
  }, [theme])

  return (
    <header className="sticky top-0 z-40 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-100 dark:border-white/5">
      <div className="flex h-[var(--topbar-height)] items-center justify-between px-4 sm:px-6 lg:px-10">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2.5 rounded-xl border border-zinc-200/90 dark:border-white/10 bg-white/95 dark:bg-zinc-900/95 px-3 py-2 shadow-sm">
            <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-300">
              <Building2 className="h-3 w-3 shrink-0" />
              Org
            </span>
            <span className="block truncate max-w-[40vw] sm:max-w-[34vw] lg:max-w-[24vw] text-[12px] sm:text-[13px] font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              {currentOrgName}
            </span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <span className="block text-sm font-black tracking-tight text-zinc-950 dark:text-zinc-50 leading-none">{displayName}</span>
            <span className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1 leading-none opacity-60">{formattedRole}</span>
          </div>

          <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 rounded-xl border border-zinc-100 dark:border-white/5 bg-white dark:bg-zinc-900 text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-950 dark:hover:text-white transition-all shadow-sm"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-emerald-500 text-[9px] font-black text-zinc-950 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            {notificationsOpen && (
              <DropdownMenuContent align="end" className="w-[360px] p-0 rounded-2xl border-zinc-100 dark:border-white/10 shadow-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-100 dark:border-white/10 bg-zinc-50/80 dark:bg-zinc-900/80">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Notifications</p>
                      <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => void loadNotifications()}
                        className="h-7 w-7 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center justify-center"
                        aria-label="Refresh notifications"
                      >
                        <RefreshCw className={cn("h-3.5 w-3.5", notificationsLoading && "animate-spin")} />
                      </button>
                      <button
                        type="button"
                        onClick={markAllRead}
                        className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-500"
                      >
                        Mark all read
                      </button>
                    </div>
                  </div>
                </div>
                <div className="max-h-[340px] overflow-auto p-2">
                  {notificationsLoading && notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-zinc-500">Loading notifications...</div>
                  ) : notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-zinc-500">No notifications right now.</div>
                  ) : (
                    notifications.map((n) => {
                      const unread = !readMap[n.id]
                      return (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            markNotificationRead(n.id)
                            openNotificationHref(n.href)
                            setNotificationsOpen(false)
                          }}
                          className={cn(
                            "w-full text-left p-3 rounded-xl border mb-1.5 transition-colors",
                            unread
                              ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-500/10"
                              : "border-zinc-100 bg-white dark:border-white/10 dark:bg-zinc-900"
                          )}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5">{iconForKind(n.kind)}</div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-black text-zinc-900 dark:text-zinc-100">{n.title}</p>
                                {unread && <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />}
                              </div>
                              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">{n.message}</p>
                            </div>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </DropdownMenuContent>
            )}
          </DropdownMenu>

          <DropdownMenu open={profileMenuOpen} onOpenChange={setProfileMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-9 w-9 p-0 rounded-xl border border-zinc-200 dark:border-emerald-500/20 bg-emerald-600 dark:bg-emerald-500 text-white dark:text-zinc-950 hover:bg-emerald-700 dark:hover:bg-emerald-400 transition-all font-black text-xs shadow-lg shadow-emerald-500/20"
              >
                {displayName.charAt(0).toUpperCase()}
              </Button>
            </DropdownMenuTrigger>
            {profileMenuOpen && (
              <DropdownMenuContent align="end" className="w-80 p-5 rounded-[2.5rem] border-zinc-100 dark:border-white/5 shadow-2xl animate-in fade-in zoom-in-95 duration-500 mt-4 overflow-hidden relative bg-white dark:bg-zinc-900/95 backdrop-blur-xl">
                <div className="absolute top-0 right-0 h-32 w-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />

                <div className="relative z-10 flex items-center gap-5 mb-6">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white dark:text-zinc-950 text-2xl font-black italic shadow-xl shadow-emerald-200 dark:shadow-none">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="space-y-1">
                    <p className="font-black italic text-zinc-950 dark:text-zinc-50 uppercase tracking-tight leading-none text-lg leading-tight">{displayName}</p>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest truncate max-w-[180px]">{profile?.email}</p>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[8px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-tighter">Verified Session</span>
                    </div>
                  </div>
                </div>

                <DropdownMenuSeparator className="bg-zinc-100 dark:bg-white/5 mb-4" />

                <div className="space-y-1.5">
                  <p className="text-[9px] font-black text-zinc-300 dark:text-zinc-600 uppercase tracking-[0.3em] px-4 mb-2">Appearance</p>
                  <div
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="mx-1 group/theme flex items-center justify-between py-3.5 px-5 rounded-2xl border border-zinc-200/70 dark:border-white/10 bg-gradient-to-r from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-900/80 hover:border-zinc-300 dark:hover:border-white/20 cursor-pointer transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-4 h-4">
                        <Sun className="absolute inset-0 h-4 w-4 text-amber-500 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute inset-0 h-4 w-4 text-blue-400 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                      </div>
                      <span className="font-black text-[10px] uppercase tracking-widest text-zinc-600 dark:text-zinc-300">
                        Theme: <span className="text-zinc-900 dark:text-zinc-100">{theme === "dark" ? "Dark" : "Light"}</span>
                      </span>
                    </div>
                    <div className="h-6 w-11 rounded-full bg-zinc-200/80 dark:bg-zinc-800 p-0.5 flex items-center transition-colors ring-1 ring-zinc-300/50 dark:ring-white/10">
                      <div className={cn(
                        "h-5 w-5 rounded-full shadow-sm transition-all duration-300",
                        theme === "dark" ? "translate-x-5 bg-blue-500" : "translate-x-0 bg-white"
                      )} />
                    </div>
                  </div>
                </div>

                <DropdownMenuSeparator className="bg-zinc-100 dark:bg-white/5 my-4" />

                <DropdownMenuItem onClick={handleLogout} className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-500/10 rounded-2xl py-4 px-5 font-black text-[11px] uppercase tracking-[0.2em] cursor-pointer group/logout">
                  <div className="flex items-center justify-between w-full">
                    <span className="flex items-center"><LogOutIcon className="mr-3 h-4 w-4" /> Logout</span>
                    <HardDrive className="h-3 w-3 opacity-0 group-hover/logout:opacity-100 transition-opacity" />
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            )}
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
