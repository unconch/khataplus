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
import { LogOutIcon, Building2, Bell, HardDrive, Sun, Moon, AlertTriangle, ShieldAlert, Info, CheckCircle2, RefreshCw, ChevronsUpDown, Check, Store } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useTenant } from "@/components/tenant-provider"
import { useLocale } from "@/components/locale-provider"
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

type UserOrganization = {
  id: string
  org_id: string
  role: string
  organization?: {
    id?: string
    name?: string | null
    slug?: string | null
  } | null
}

type HeaderStore = {
  id: string
  name: string
  code: string
  is_default: boolean
}

export function AppHeader({ profile, orgName, role: currentRole, pathPrefix = "" }: AppHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { tenant } = useTenant()
  const { theme, setTheme } = useTheme()
  const { dictionary } = useLocale()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [orgMenuOpen, setOrgMenuOpen] = useState(false)
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [notifications, setNotifications] = useState<HeaderNotification[]>([])
  const [readMap, setReadMap] = useState<Record<string, boolean>>({})
  const [userOrganizations, setUserOrganizations] = useState<UserOrganization[]>([])
  const [orgsLoading, setOrgsLoading] = useState(false)
  const [switchingOrgSlug, setSwitchingOrgSlug] = useState<string | null>(null)
  const [storeMenuOpen, setStoreMenuOpen] = useState(false)
  const [storesLoading, setStoresLoading] = useState(false)
  const [stores, setStores] = useState<HeaderStore[]>([])
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null)
  const [switchingStoreId, setSwitchingStoreId] = useState<string | null>(null)

  const currentOrgName = tenant?.name || orgName || dictionary.appHeader.defaultOrgName
  const orgId = String(tenant?.id || "global")
  const currentOrgSlug = String(tenant?.slug || "").trim().toLowerCase()
  const readStoreKey = `kp-notif-read:${orgId}`

  const displayName = profile?.name ||
    profile?.email?.split('@')[0] ||
    dictionary.appHeader.defaultDisplayName

  const displayRole = currentRole || profile?.role || ""

  const formattedRole = displayRole === "main admin" ? dictionary.appHeader.roleSystemAdmin :
    displayRole === "owner" ? dictionary.appHeader.rolePrimaryOwner :
      displayRole === "staff" ? dictionary.appHeader.roleAssociate :
        displayRole || dictionary.appHeader.defaultRole

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
    if (!href.startsWith("/")) {
      window.location.href = href
      return
    }
    const isDashboardRoute = href.startsWith("/dashboard")
    const target = isDashboardRoute && pathPrefix ? `${pathPrefix}${href}` : href
    router.push(target)
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
  }, [notificationsOpen, loadNotifications])

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

  const loadOrganizations = useCallback(async () => {
    if (!profile || tenant?.id === "demo-org") {
      setUserOrganizations([])
      return
    }

    setOrgsLoading(true)
    try {
      const res = await fetch("/api/organizations", { cache: "no-store" })
      const data = await res.json().catch(() => [])
      if (!res.ok) throw new Error("Failed to load organizations")
      setUserOrganizations(Array.isArray(data) ? data : [])
    } catch {
      setUserOrganizations([])
    } finally {
      setOrgsLoading(false)
    }
  }, [profile, tenant?.id])

  useEffect(() => {
    void loadOrganizations()
  }, [loadOrganizations])

  const loadStores = useCallback(async () => {
    if (!profile || tenant?.id === "demo-org" || !currentOrgSlug) {
      setStores([])
      setActiveStoreId(null)
      return
    }

    setStoresLoading(true)
    try {
      const res = await fetch("/api/stores", { cache: "no-store" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to load stores")

      setStores(Array.isArray(data?.stores) ? data.stores : [])
      setActiveStoreId(String(data?.activeStoreId || "").trim() || null)
    } catch {
      setStores([])
      setActiveStoreId(null)
    } finally {
      setStoresLoading(false)
    }
  }, [profile, tenant?.id, currentOrgSlug])

  useEffect(() => {
    void loadStores()
  }, [loadStores])

  const handleOrgSwitch = useCallback((targetSlug: string | null | undefined) => {
    const slug = String(targetSlug || "").trim().toLowerCase()
    if (!slug || slug === currentOrgSlug) {
      setOrgMenuOpen(false)
      return
    }

    setSwitchingOrgSlug(slug)
    setOrgMenuOpen(false)

    const search = typeof window !== "undefined" ? window.location.search : ""
    const currentPath = pathname || ""
    let targetPath = `/app/${slug}/dashboard`

    if (pathPrefix && currentPath.startsWith(pathPrefix)) {
      const suffix = currentPath.slice(pathPrefix.length) || "/dashboard"
      targetPath = `/app/${slug}${suffix}`
    } else if (/^\/app\/[^/]+(?:\/.*)?$/.test(currentPath)) {
      targetPath = currentPath.replace(/^\/app\/[^/]+/, `/app/${slug}`)
    } else if (currentPath.startsWith("/dashboard")) {
      targetPath = `/app/${slug}${currentPath}`
    }

    void (async () => {
      try {
        const res = await fetch("/api/organizations/select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug }),
        })
        if (!res.ok) {
          throw new Error("Failed to persist active organization")
        }
      } catch {
        document.cookie = `kp_org_slug=${slug}; path=/; max-age=2592000; samesite=lax`
      } finally {
        router.push(`${targetPath}${search}`)
        router.refresh()
      }
    })()
  }, [currentOrgSlug, pathPrefix, pathname, router])

  const switchableOrganizations = useMemo(() => {
    return userOrganizations
      .map((membership) => ({
        membershipId: membership.id,
        orgId: membership.org_id,
        role: membership.role,
        name: String(membership.organization?.name || "").trim(),
        slug: String(membership.organization?.slug || "").trim().toLowerCase(),
      }))
      .filter((org) => org.name && org.slug)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [userOrganizations])

  const activeStore = useMemo(
    () => stores.find((store) => store.id === activeStoreId) || stores.find((store) => store.is_default) || stores[0] || null,
    [stores, activeStoreId]
  )

  const handleStoreSwitch = useCallback((targetStoreId: string | null | undefined) => {
    const storeId = String(targetStoreId || "").trim()
    if (!storeId || storeId === activeStoreId) {
      setStoreMenuOpen(false)
      return
    }

    setSwitchingStoreId(storeId)
    setStoreMenuOpen(false)

    void (async () => {
      try {
        const res = await fetch("/api/stores/select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storeId }),
        })
        if (!res.ok) throw new Error("Failed to persist active store")
        setActiveStoreId(storeId)
      } catch {
        document.cookie = `kp_active_store=${storeId}; path=/; max-age=2592000; samesite=lax`
      } finally {
        router.refresh()
        setSwitchingStoreId(null)
      }
    })()
  }, [activeStoreId, router])

  useEffect(() => {
    if (!theme || typeof document === "undefined") return
    document.cookie = `kp_theme=${theme}; path=/; max-age=31536000; samesite=lax`
  }, [theme])

  return (
    <header className="app-topbar sticky top-0 z-40 border-b border-zinc-100 bg-zinc-50/80 pt-safe backdrop-blur-xl dark:border-white/8 dark:bg-[rgba(17,24,39,0.72)]">
      <div className="flex h-[var(--topbar-height)] items-center justify-between px-4 sm:px-6 lg:px-10">
        <div className="min-w-0 flex flex-1 items-center gap-2 overflow-hidden">
          <DropdownMenu open={orgMenuOpen} onOpenChange={setOrgMenuOpen}>
            <DropdownMenuTrigger asChild disabled={switchableOrganizations.length <= 1}>
              <button
                type="button"
                className={cn(
                  "inline-flex min-w-0 max-w-[52vw] items-center gap-2 rounded-xl border border-zinc-200/90 bg-white/95 px-2.5 py-2 shadow-sm dark:border-white/10 dark:bg-[rgba(30,41,59,0.88)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.28)] sm:max-w-[44vw] lg:max-w-[30vw]",
                  switchableOrganizations.length > 1 && "transition-all hover:border-emerald-300 hover:bg-white dark:hover:border-emerald-400/30"
                )}
              >
                <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:bg-white/8 dark:text-zinc-200">
                  <Building2 className="h-3 w-3 shrink-0" />
                  Org
                </span>
                <span className="block min-w-0 truncate text-[12px] sm:text-[13px] font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {currentOrgName}
                </span>
                {switchableOrganizations.length > 1 ? (
                  <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-300" />
                ) : null}
              </button>
            </DropdownMenuTrigger>
            {switchableOrganizations.length > 1 && (
              <DropdownMenuContent align="start" className="w-72 rounded-2xl border-zinc-100 p-2 shadow-2xl dark:border-white/10 dark:bg-[rgba(15,23,42,0.96)]">
                <div className="px-3 py-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400">Switch Organization</p>
                </div>
                <DropdownMenuSeparator className="bg-zinc-100 dark:bg-white/5" />
                {orgsLoading ? (
                  <div className="px-3 py-6 text-center text-[11px] font-semibold text-zinc-500">Loading organizations...</div>
                ) : (
                  switchableOrganizations.map((org) => {
                    const isActive = org.slug === currentOrgSlug
                    const isSwitching = switchingOrgSlug === org.slug
                    return (
                      <DropdownMenuItem
                        key={org.membershipId}
                        onSelect={() => {
                          void handleOrgSwitch(org.slug)
                        }}
                        className="mt-1 rounded-xl px-3 py-3 focus:bg-zinc-50 dark:focus:bg-[rgba(30,41,59,0.88)]"
                      >
                        <div className="flex w-full items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-zinc-900 dark:text-zinc-100">{org.name}</p>
                            <p className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">{org.role}</p>
                          </div>
                          {isSwitching ? (
                            <RefreshCw className="h-3.5 w-3.5 shrink-0 animate-spin text-emerald-500" />
                          ) : isActive ? (
                            <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                          ) : null}
                        </div>
                      </DropdownMenuItem>
                    )
                  })
                )}
              </DropdownMenuContent>
            )}
          </DropdownMenu>

          <DropdownMenu open={storeMenuOpen} onOpenChange={setStoreMenuOpen}>
            <DropdownMenuTrigger asChild disabled={stores.length <= 1}>
              <button
                type="button"
                className={cn(
                  "inline-flex min-w-0 max-w-[36vw] items-center gap-2 rounded-xl border border-zinc-200/90 bg-white/95 px-2.5 py-2 shadow-sm dark:border-white/10 dark:bg-[rgba(30,41,59,0.88)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.28)] sm:max-w-[28vw] lg:max-w-[18vw]",
                  stores.length > 1 && "transition-all hover:border-sky-300 hover:bg-white dark:hover:border-sky-400/30"
                )}
              >
                <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500 dark:bg-white/8 dark:text-zinc-200">
                  <Store className="h-3 w-3 shrink-0" />
                  Store
                </span>
                <span className="block min-w-0 truncate text-[12px] sm:text-[13px] font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {activeStore?.name || "Main Branch"}
                </span>
                {stores.length > 1 ? (
                  <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-300" />
                ) : null}
              </button>
            </DropdownMenuTrigger>
            {stores.length > 1 && (
              <DropdownMenuContent align="start" className="w-72 rounded-2xl border-zinc-100 p-2 shadow-2xl dark:border-white/10 dark:bg-[rgba(15,23,42,0.96)]">
                <div className="px-3 py-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400">Switch Store</p>
                </div>
                <DropdownMenuSeparator className="bg-zinc-100 dark:bg-white/5" />
                {storesLoading ? (
                  <div className="px-3 py-6 text-center text-[11px] font-semibold text-zinc-500">Loading stores...</div>
                ) : (
                  stores.map((store) => {
                    const isActive = store.id === activeStoreId
                    const isSwitching = switchingStoreId === store.id
                    return (
                      <DropdownMenuItem
                        key={store.id}
                        onSelect={() => {
                          void handleStoreSwitch(store.id)
                        }}
                        className="mt-1 rounded-xl px-3 py-3 focus:bg-zinc-50 dark:focus:bg-[rgba(30,41,59,0.88)]"
                      >
                        <div className="flex w-full items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-zinc-900 dark:text-zinc-100">{store.name}</p>
                            <p className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                              {store.code}{store.is_default ? " • Default" : ""}
                            </p>
                          </div>
                          {isSwitching ? (
                            <RefreshCw className="h-3.5 w-3.5 shrink-0 animate-spin text-sky-500" />
                          ) : isActive ? (
                            <Check className="h-4 w-4 shrink-0 text-sky-500" />
                          ) : null}
                        </div>
                      </DropdownMenuItem>
                    )
                  })
                )}
              </DropdownMenuContent>
            )}
          </DropdownMenu>
        </div>

        <div className="ml-2 flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden sm:block text-right">
            <span className="block text-sm font-black tracking-tight text-zinc-950 dark:text-zinc-50 leading-none">{displayName}</span>
            <span className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1 leading-none opacity-60">{formattedRole}</span>
          </div>

          <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-10 w-10 rounded-xl border border-zinc-100 bg-white text-zinc-400 shadow-sm transition-all hover:bg-zinc-50 hover:text-zinc-950 dark:border-white/8 dark:bg-[rgba(30,41,59,0.88)] dark:text-zinc-300 dark:shadow-[0_10px_26px_rgba(0,0,0,0.24)] dark:hover:bg-[rgba(51,65,85,0.96)] dark:hover:text-white"
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
              <DropdownMenuContent align="end" className="w-[360px] overflow-hidden rounded-2xl border-zinc-100 p-0 shadow-2xl dark:border-white/10 dark:bg-[rgba(15,23,42,0.96)]">
                <div className="border-b border-zinc-100 bg-zinc-50/80 px-4 py-3 dark:border-white/10 dark:bg-[rgba(30,41,59,0.82)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">{dictionary.appHeader.notifications}</p>
                      <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        {unreadCount > 0 ? dictionary.appHeader.unreadCount(unreadCount) : dictionary.appHeader.allCaughtUp}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => void loadNotifications()}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-900 dark:border-white/10 dark:bg-[rgba(15,23,42,0.9)] dark:text-zinc-300 dark:hover:text-zinc-100"
                        aria-label={dictionary.appHeader.refreshNotifications}
                      >
                        <RefreshCw className={cn("h-3.5 w-3.5", notificationsLoading && "animate-spin")} />
                      </button>
                      <button
                        type="button"
                        onClick={markAllRead}
                        className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-500"
                      >
                        {dictionary.appHeader.markAllRead}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="max-h-[340px] overflow-auto p-2">
                  {notificationsLoading && notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-zinc-500">{dictionary.appHeader.loadingNotifications}</div>
                  ) : notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-zinc-500">{dictionary.appHeader.noNotifications}</div>
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
                className="h-10 w-10 rounded-xl border border-zinc-200 bg-emerald-600 p-0 text-xs font-black text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500 dark:text-zinc-950 dark:shadow-[0_14px_32px_rgba(16,185,129,0.24)] dark:hover:bg-emerald-400"
              >
                {displayName.charAt(0).toUpperCase()}
              </Button>
            </DropdownMenuTrigger>
            {profileMenuOpen && (
              <DropdownMenuContent align="end" className="relative mt-4 w-80 overflow-hidden rounded-[2.5rem] border-zinc-100 bg-white p-5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500 dark:border-white/8 dark:bg-[rgba(15,23,42,0.96)]">
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
                      <span className="text-[8px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-tighter">{dictionary.appHeader.verifiedSession}</span>
                    </div>
                  </div>
                </div>

                <DropdownMenuSeparator className="bg-zinc-100 dark:bg-white/5 mb-4" />

                <div className="space-y-1.5">
                  <p className="mb-2 px-4 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-300 dark:text-zinc-500">{dictionary.appHeader.appearance}</p>
                  <div
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="group/theme mx-1 flex cursor-pointer items-center justify-between rounded-2xl border border-zinc-200/70 bg-gradient-to-r from-zinc-50 to-white px-5 py-3.5 transition-all duration-300 hover:border-zinc-300 dark:border-white/10 dark:from-[rgba(30,41,59,0.9)] dark:to-[rgba(15,23,42,0.9)] dark:hover:border-emerald-400/25"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-4 h-4">
                        <Sun className="absolute inset-0 h-4 w-4 text-amber-500 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute inset-0 h-4 w-4 text-blue-400 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                      </div>
                      <span className="font-black text-[10px] uppercase tracking-widest text-zinc-600 dark:text-zinc-300">
                        {dictionary.appHeader.themeLabel}: <span className="text-zinc-900 dark:text-zinc-100">{theme === "dark" ? dictionary.appHeader.dark : dictionary.appHeader.light}</span>
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
                    <span className="flex items-center"><LogOutIcon className="mr-3 h-4 w-4" /> {dictionary.appHeader.logout}</span>
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
