"use client"

import { useState, useEffect, useMemo } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
    Users,
    Box,
    TrendingUp,
    Plus,
    Search,
    IndianRupee,
    ArrowUpRight,
    Zap,
    Activity,
    AlertCircle,
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Profile, SystemSettings, DailyReport, Organization, Sale } from "@/lib/types"
import { resolveGreeting, resetGreetingEngine, type AppStateKey, type MotionProfile, type UserContextKey, type GreetingPeriod } from "@/lib/greeting-engine"

const SearchDialog = dynamic(() => import("@/components/search-dialog").then((m) => m.SearchDialog), { ssr: false })
const PwaInstallPrompt = dynamic(() => import("@/components/pwa-install-prompt").then((m) => m.PwaInstallPrompt), { ssr: false })
const AreaChart = dynamic(() => import("recharts").then((m) => m.AreaChart), { ssr: false })
const Area = dynamic(() => import("recharts").then((m) => m.Area), { ssr: false })
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false })
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid), { ssr: false })
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false })
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false })

interface HomeDashboardProps {
    profile: Profile
    org: Organization
    settings: SystemSettings
    onboardingStats: {
        hasInventory: boolean
        hasCustomers: boolean
        hasSales: boolean
        isProfileComplete: boolean
    }
    reports: DailyReport[]
    unpaidAmount: number
    toPayAmount: number
    inventoryHealth: number
    lowStockCount: number
    sales: Sale[]
    inventoryCount: number
}

export function HomeDashboard({
    profile,
    org,
    reports,
    unpaidAmount,
    sales,
    lowStockCount,
    inventoryCount,
}: HomeDashboardProps) {
    const [isMounted, setIsMounted] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)
    const [isMobileViewport, setIsMobileViewport] = useState(false)
    const [enableDeferredUI, setEnableDeferredUI] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => setIsMounted(true), 100)
        return () => clearTimeout(timer)
    }, [])

    useEffect(() => {
        if (typeof window === "undefined") return
        if ("requestIdleCallback" in window) {
            const idleId = window.requestIdleCallback(() => setEnableDeferredUI(true), { timeout: 1200 })
            return () => window.cancelIdleCallback(idleId)
        }
        const timer = window.setTimeout(() => setEnableDeferredUI(true), 200)
        return () => window.clearTimeout(timer)
    }, [])

    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mediaQuery = window.matchMedia("(max-width: 767px)")
        const update = () => setIsMobileViewport(mediaQuery.matches)
        update()
        mediaQuery.addEventListener("change", update)
        return () => mediaQuery.removeEventListener("change", update)
    }, [])

    const firstName = profile.name?.split(" ")[0] || "User"
    const [greeting, setGreeting] = useState("Hello")
    const [greetingToneClass, setGreetingToneClass] = useState("bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 bg-clip-text text-transparent dark:from-slate-100 dark:via-slate-300 dark:to-slate-500")

    useEffect(() => {
        const resetVersionKey = "kh:greeting:reset-version"
        const resetVersion = "2026-02-26-dataset-reset"
        if (window.localStorage.getItem(resetVersionKey) !== resetVersion) {
            resetGreetingEngine()
            window.localStorage.setItem(resetVersionKey, resetVersion)
        }

        const now = new Date()
        const userKey = profile.id || firstName.toLowerCase()
        const todayToken = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
        const seenDateKey = `kh:greeting:seen-date:${userKey}`
        const lastSeenKey = `kh:greeting:last-seen:${userKey}`
        const dayHitsKey = `kh:greeting:day-hits:${userKey}:${todayToken}`

        const lastSeenDate = window.localStorage.getItem(seenDateKey)
        const lastSeenAtRaw = window.localStorage.getItem(lastSeenKey)

        const isFirstVisitToday = lastSeenDate !== todayToken
        const lastSeenAt = lastSeenAtRaw ? Number(lastSeenAtRaw) : 0
        const isReturningAfterBreak = !!lastSeenAt && now.getTime() - lastSeenAt > 4 * 60 * 60 * 1000

        const dayHits = Number(window.localStorage.getItem(dayHitsKey) || "0") + 1
        window.localStorage.setItem(dayHitsKey, String(dayHits))

        const pendingTasks = (lowStockCount > 0 ? 1 : 0) + (unpaidAmount > 0 ? 1 : 0)
        const hasNewAlerts = lowStockCount > 0

        const appState: AppStateKey =
            pendingTasks > 0 ? "pendingTasks" :
                hasNewAlerts ? "newAlerts" :
                    "allClear"

        const userContext: UserContextKey =
            dayHits >= 4 ? "veryActiveUser" :
                isReturningAfterBreak ? "returningAfterHours" :
                    isFirstVisitToday ? "firstLoginToday" :
                        "returningAfterHours"

        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata"
        const prefersReduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
        const staticMotion = typeof document !== "undefined" && document.documentElement.classList.contains("static-motion")
        const hwThreads = typeof navigator !== "undefined" ? (navigator.hardwareConcurrency || 8) : 8
        const mem = typeof navigator !== "undefined" && "deviceMemory" in navigator ? Number((navigator as any).deviceMemory || 8) : 8
        const motionProfile: MotionProfile =
            prefersReduced || staticMotion ? "reduced" :
                hwThreads <= 4 || mem <= 4 ? "lite" : "full"

        const resolvedGreeting = resolveGreeting({
            timezone,
            name: firstName,
            tone: "mix",
            userContext,
            appState,
            motionProfile,
        })

        setGreeting(resolvedGreeting.text)
        const periodToneMap: Record<GreetingPeriod, string> = {
            earlyMorning: "bg-gradient-to-r from-cyan-700 via-sky-600 to-blue-500 bg-clip-text text-transparent dark:from-cyan-300 dark:via-sky-300 dark:to-blue-400",
            morning: "bg-gradient-to-r from-sky-700 via-blue-600 to-indigo-500 bg-clip-text text-transparent dark:from-sky-300 dark:via-blue-300 dark:to-indigo-400",
            midMorning: "bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-500 bg-clip-text text-transparent dark:from-blue-300 dark:via-indigo-300 dark:to-violet-400",
            preLunch: "bg-gradient-to-r from-amber-700 via-orange-600 to-yellow-500 bg-clip-text text-transparent dark:from-amber-300 dark:via-orange-300 dark:to-yellow-400",
            lunch: "bg-gradient-to-r from-orange-700 via-amber-600 to-lime-500 bg-clip-text text-transparent dark:from-orange-300 dark:via-amber-300 dark:to-lime-400",
            postLunch: "bg-gradient-to-r from-lime-700 via-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-lime-300 dark:via-emerald-300 dark:to-teal-400",
            afternoon: "bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-500 bg-clip-text text-transparent dark:from-emerald-300 dark:via-teal-300 dark:to-cyan-400",
            earlyEvening: "bg-gradient-to-r from-violet-700 via-purple-600 to-fuchsia-500 bg-clip-text text-transparent dark:from-violet-300 dark:via-purple-300 dark:to-fuchsia-400",
            evening: "bg-gradient-to-r from-fuchsia-700 via-pink-600 to-rose-500 bg-clip-text text-transparent dark:from-fuchsia-300 dark:via-pink-300 dark:to-rose-400",
            lateEvening: "bg-gradient-to-r from-indigo-700 via-violet-600 to-purple-500 bg-clip-text text-transparent dark:from-indigo-300 dark:via-violet-300 dark:to-purple-400",
            earlyNight: "bg-gradient-to-r from-blue-800 via-indigo-700 to-violet-600 bg-clip-text text-transparent dark:from-blue-200 dark:via-indigo-300 dark:to-violet-400",
            midnight: "bg-gradient-to-r from-slate-700 via-zinc-600 to-neutral-500 bg-clip-text text-transparent dark:from-slate-200 dark:via-zinc-300 dark:to-neutral-400",
            lateNight: "bg-gradient-to-r from-zinc-700 via-neutral-600 to-stone-500 bg-clip-text text-transparent dark:from-zinc-200 dark:via-neutral-300 dark:to-stone-400",
        }
        setGreetingToneClass(
            periodToneMap[resolvedGreeting.timePeriod] ||
            "bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 bg-clip-text text-transparent dark:from-slate-100 dark:via-slate-300 dark:to-slate-500"
        )
        window.localStorage.setItem(seenDateKey, todayToken)
        window.localStorage.setItem(lastSeenKey, String(now.getTime()))
    }, [firstName, lowStockCount, profile.id, unpaidAmount])

    const [timeRange, setTimeRange] = useState<"today" | "week" | "month">("month")
    const greetingClassName = useMemo(() => {
        const len = greeting.length
        if (len > 95) return "text-2xl md:text-3xl sm:text-4xl leading-tight tracking-tight"
        if (len > 72) return "text-[1.75rem] md:text-[2.15rem] sm:text-[2.45rem] leading-tight tracking-tight"
        return "text-3xl md:text-4xl sm:text-5xl tracking-tight"
    }, [greeting])

    const metrics = useMemo(() => {
        const now = new Date()
        let filtered = reports
        if (timeRange === "today") {
            const todayStr = now.toISOString().split("T")[0]
            filtered = reports.filter((r) => r.report_date === todayStr)
        } else if (timeRange === "week") {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            filtered = reports.filter((r) => new Date(r.report_date) >= weekAgo)
        }

        const revenue = filtered.reduce((sum, r) => sum + (r.total_sale_gross || 0), 0)
        const cost = filtered.reduce((sum, r) => sum + (r.total_cost || 0), 0)
        const profit = revenue - cost

        return { revenue, profit }
    }, [reports, timeRange])

    const chartData = useMemo(() => {
        return reports
            .slice()
            .reverse()
            .slice(timeRange === "month" ? -30 : timeRange === "week" ? -7 : -1)
            .map((r) => ({
                date: new Date(r.report_date).toLocaleDateString(undefined, { day: "numeric", month: "short" }),
                revenue: r.total_sale_gross ?? 0,
                profit: (r.total_sale_gross ?? 0) - (r.total_cost ?? 0),
            }))
    }, [reports, timeRange])

    const stockAlertsCount = inventoryCount === 0 ? 0 : lowStockCount

    if (!isMounted) return null

    const formatCurrency = (val: number) => {
        const rs = "\u20B9"
        return `${rs}${Math.round(val).toLocaleString()}`
    }

    return (
        <div className="min-h-full space-y-6 md:space-y-10 pb-20 bg-background/50">
            {(enableDeferredUI || searchOpen) && <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />}
            {enableDeferredUI && <PwaInstallPrompt />}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8 pt-2 md:pt-4">
                <div className="space-y-1 md:space-y-2">
                    <h1
                        key={greeting}
                        className={cn(
                            "font-black max-w-4xl transition-colors md:transition-all md:duration-500",
                            greetingClassName,
                            greetingToneClass
                        )}
                    >
                        {greeting}
                    </h1>
                </div>

                <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
                    <button
                        onClick={() => setSearchOpen(true)}
                        className="group flex-1 md:flex-none flex h-10 md:h-12 items-center gap-2 md:gap-4 rounded-xl border bg-card px-3 md:px-4 text-xs md:text-sm font-medium transition-colors md:transition-all md:hover:border-emerald-500/30 md:hover:shadow-lg"
                    >
                        <Search className="h-4 w-4 text-muted-foreground group-hover:text-emerald-500" />
                        <span className="text-muted-foreground truncate">Search</span>
                        <kbd className="hidden h-5 items-center gap-1 rounded bg-muted px-1.5 font-mono text-[10px] sm:flex">Ctrl+K</kbd>
                    </button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex h-10 md:h-12 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-300 via-sky-300 to-cyan-300 px-3 md:px-6 py-2 text-xs md:text-sm font-bold text-slate-900 shadow-xl transition-colors md:transition-all md:hover:from-indigo-200 md:hover:via-sky-200 md:hover:to-cyan-200 md:active:scale-95 dark:from-indigo-400 dark:via-sky-400 dark:to-cyan-400 dark:text-slate-950">
                                <Plus className="mr-1.5 md:mr-2 h-4 w-4" />
                                <span>New</span>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64 p-2 rounded-xl shadow-2xl border-zinc-100 dark:border-white/10">
                            <ActionLink icon={IndianRupee} label="Record Sale" sub="Counter Entry" href={`/dashboard/sales?action=new`} color="emerald" />
                            <ActionLink icon={Box} label="Stock In" sub="Inventory" href={`/dashboard/inventory`} color="blue" />
                            <ActionLink icon={Users} label="Khata Entry" sub="Manage Ledger" href={`/dashboard/customers`} color="purple" />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden p-2 md:p-0 grid grid-cols-2 gap-2 md:gap-0 md:flex md:flex-row md:divide-x md:transition-all md:hover:shadow-md">
                <MetricStripItem icon={Box} label="Product Range" value={inventoryCount.toString()} color="zinc" />
                <MetricStripItem icon={AlertCircle} label="Stock Alerts" value={stockAlertsCount.toString()} color="orange" isAlert={stockAlertsCount > 0} />
                <MetricStripItem icon={IndianRupee} label="Receivables" value={formatCurrency(unpaidAmount)} color="emerald" />
                <MetricStripItem icon={TrendingUp} label="Net Profit" value={formatCurrency(metrics.profit)} color="blue" />
            </div>

            <div className="grid gap-4 md:gap-8 lg:grid-cols-12">
                <div className="lg:col-span-8 rounded-2xl md:rounded-3xl border bg-card/50 shadow-sm p-4 md:p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 md:p-8 opacity-5 md:transition-opacity md:group-hover:opacity-10">
                        <Activity className="h-12 w-12 text-primary" />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:gap-6 relative z-10">
                        <div className="space-y-1">
                            <h3 className="text-lg md:text-xl font-bold tracking-tight">Financial Velocity</h3>
                            <p className="text-xs md:text-sm text-muted-foreground">Revenue and profit generation stream</p>
                        </div>
                        <div className="flex gap-1 bg-muted/50 p-1 rounded-xl">
                            {[
                                { key: "today", label: "Today" },
                                { key: "week", label: "This Week" },
                                { key: "month", label: "This Month" },
                            ].map((range) => (
                                <button
                                    key={range.key}
                                    onClick={() => setTimeRange(range.key as any)}
                                    className={cn(
                                        "px-3 md:px-4 py-1.5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors md:transition-all",
                                        timeRange === range.key
                                            ? "bg-white dark:bg-emerald-500 text-zinc-950 shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {range.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-[240px] md:h-[340px] w-full mt-6 md:mt-10">
                        {enableDeferredUI ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="rgba(0,0,0,0.03)" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: "#888" }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: "#888" }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)" }}
                                        cursor={{ stroke: "var(--primary)", strokeWidth: 1, strokeDasharray: "4 4" }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="var(--primary)"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#primaryGradient)"
                                        isAnimationActive={!isMobileViewport}
                                        animationDuration={isMobileViewport ? 0 : 2000}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : null}
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-4 md:space-y-6">
                    <div className="rounded-2xl md:rounded-3xl border bg-card/50 shadow-sm p-4 md:p-8 h-full">
                        <div className="flex items-center justify-between mb-4 md:mb-8">
                            <h3 className="font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Global Activity Stream</h3>
                            <Link href={`/dashboard/sales`} className="text-[10px] font-bold text-emerald-600 hover:underline">View All</Link>
                        </div>
                        <div className="space-y-2 md:space-y-4">
                            {sales.slice(0, 5).map((s) => (
                                <ActivityRow
                                    key={s.id}
                                    title={s.customer_name || "Counter Sale"}
                                    sub={`${s.quantity} units | ${new Date(s.sale_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                                    amount={`\u20B9${s.total_amount.toLocaleString()}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-3 md:gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <PortalGridItem title="Khata Rail" sub="Manage Ledger" href={`/dashboard/customers`} icon={Users} color="emerald" />
                <PortalGridItem title="Inventory" sub="Product Hub" href={`/dashboard/inventory`} icon={Box} color="blue" />
                <PortalGridItem title="Core Analytics" sub="Financial Pulse" href={`/dashboard/analytics`} icon={TrendingUp} color="purple" />
                <PortalGridItem title="System Config" sub="Meta Profiles" href={`/dashboard/settings`} icon={Zap} color="amber" />
            </div>
        </div>
    )
}

function MetricStripItem({ icon: Icon, label, value, color, isAlert }: any) {
    const iconColors: any = {
        zinc: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
        orange: "bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400",
        emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
        blue: "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    }

    return (
        <div className="flex-1 flex items-center gap-3 p-3 md:p-6 lg:p-8 rounded-xl md:rounded-none border border-zinc-100/80 md:border-0 transition-colors md:transition-all md:hover:bg-muted/30 group cursor-default md:hover-scale md:active-scale">
            <div className={cn("flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-xl transition-colors md:transition-all md:group-hover:scale-110 shadow-sm", iconColors[color])}>
                <Icon className="h-5 w-5 md:h-6 md:w-6" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground/70">{label}</span>
                <span className={cn("text-lg md:text-2xl font-black tracking-tight", isAlert ? "text-orange-600 dark:text-orange-500" : "text-foreground")}>
                    {value}
                </span>
            </div>
        </div>
    )
}

function ActivityRow({ title, sub, amount }: any) {
    return (
        <div className="flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl bg-muted/20 border border-transparent md:hover:border-zinc-200 md:dark:hover:border-white/5 transition-colors md:transition-all group gap-3">
            <div className="space-y-1 min-w-0">
                <p className="text-sm font-bold truncate md:group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{title}</p>
                <p className="text-[10px] font-medium text-muted-foreground uppercase truncate">{sub}</p>
            </div>
            <p className="text-sm md:text-base font-black italic tracking-tighter shrink-0">{amount}</p>
        </div>
    )
}

function PortalGridItem({ title, sub, href, icon: Icon, color }: any) {
    const colors: any = {
        emerald: "text-emerald-600 border-emerald-500/10 hover:bg-emerald-50 dark:hover:bg-emerald-500/5",
        blue: "text-blue-600 border-blue-500/10 hover:bg-blue-50 dark:hover:bg-blue-500/5",
        purple: "text-purple-600 border-purple-500/10 hover:bg-purple-50 dark:hover:bg-purple-500/5",
        amber: "text-amber-600 border-amber-500/10 hover:bg-amber-50 dark:hover:bg-amber-500/5",
    }

    return (
        <Link href={href} className={cn("group relative flex items-center gap-3 p-4 md:p-6 rounded-2xl md:rounded-3xl border bg-card transition-colors md:transition-all md:hover:shadow-xl md:hover:-translate-y-1", colors[color])}>
            <div className="p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-current/10 border border-current/20 shrink-0">
                <Icon className="h-5 w-5 md:h-6 md:w-6" />
            </div>
            <div className="space-y-1 min-w-0">
                <h4 className="text-lg md:text-xl font-black uppercase tracking-tight text-zinc-950 dark:text-white md:group-hover:text-current transition-colors">{title}</h4>
                <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">{sub}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground/50 md:group-hover:text-current transition-colors ml-auto shrink-0" />
        </Link>
    )
}

function ActionLink({ icon: Icon, label, sub, href, color }: any) {
    const colors: any = {
        emerald: "text-emerald-600 bg-emerald-500/10",
        blue: "text-blue-600 bg-blue-500/10",
        purple: "text-purple-600 bg-purple-500/10",
    }
    return (
        <DropdownMenuItem asChild className="rounded-xl p-3 focus:bg-muted cursor-pointer border-none transition-colors md:transition-all md:active:scale-95">
            <Link href={href} className="flex items-center gap-4 w-full">
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", colors[color])}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold">{label}</span>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest leading-none">{sub}</span>
                </div>
            </Link>
        </DropdownMenuItem>
    )
}
