"use client"

import { useState, useEffect, useMemo } from "react"
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
    Sparkles,
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Profile, SystemSettings, DailyReport, Organization, Sale } from "@/lib/types"
import { SearchDialog } from "@/components/search-dialog"
import { PwaInstallPrompt } from "@/components/pwa-install-prompt"
import { resolveGreeting, resetGreetingEngine, type AppStateKey, type MotionProfile, type UserContextKey } from "@/lib/greeting-engine"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts"

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

    useEffect(() => {
        const timer = setTimeout(() => setIsMounted(true), 100)
        return () => clearTimeout(timer)
    }, [])

    const firstName = profile.name?.split(" ")[0] || "User"
    const [greeting, setGreeting] = useState("Hello")
    const [greetingAnimationClass, setGreetingAnimationClass] = useState("animate-in fade-in duration-500")
    const [aiCoach, setAiCoach] = useState<{ headline: string; action: string; rationale: string } | null>(null)
    const [aiCoachLoading, setAiCoachLoading] = useState(false)

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
        setGreetingAnimationClass(resolvedGreeting.animationClassName)
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

    useEffect(() => {
        const storageKey = `kh:ai-coach:last:${org?.id || "unknown"}`
        const cachedAt = Number(window.localStorage.getItem(storageKey) || "0")
        const isFresh = Date.now() - cachedAt < 1000 * 60 * 60 * 4 // 4h
        if (isFresh && aiCoach) return

        let cancelled = false
        setAiCoachLoading(true)
        ; (async () => {
            try {
                const response = await fetch("/api/ai/dashboard-coach", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        revenue: metrics.revenue,
                        profit: metrics.profit,
                        receivables: unpaidAmount,
                        lowStockCount,
                        inventoryCount,
                    }),
                })
                const data = await response.json().catch(() => null)
                if (!cancelled && response.ok && data?.headline) {
                    setAiCoach({
                        headline: String(data.headline),
                        action: String(data.action || ""),
                        rationale: String(data.rationale || ""),
                    })
                    window.localStorage.setItem(storageKey, String(Date.now()))
                }
            } catch {
                // silent fallback
            } finally {
                if (!cancelled) setAiCoachLoading(false)
            }
        })()

        return () => {
            cancelled = true
        }
    }, [aiCoach, inventoryCount, lowStockCount, metrics.profit, metrics.revenue, org?.id, unpaidAmount])

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
            <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
            <PwaInstallPrompt />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8 pt-2 md:pt-4">
                <div className="space-y-1 md:space-y-2">
                    <h1 key={`${greeting}-${greetingAnimationClass}`} className={cn("font-black text-foreground max-w-4xl", greetingClassName, greetingAnimationClass)}>
                        {greeting}
                    </h1>
                </div>

                <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
                    <button
                        onClick={() => setSearchOpen(true)}
                        className="group flex-1 md:flex-none flex h-10 md:h-12 items-center gap-2 md:gap-4 rounded-xl border bg-card px-3 md:px-4 text-xs md:text-sm font-medium transition-all hover:border-emerald-500/30 hover:shadow-lg"
                    >
                        <Search className="h-4 w-4 text-muted-foreground group-hover:text-emerald-500" />
                        <span className="text-muted-foreground truncate">Search</span>
                        <kbd className="hidden h-5 items-center gap-1 rounded bg-muted px-1.5 font-mono text-[10px] sm:flex">Ctrl+K</kbd>
                    </button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex h-10 md:h-12 items-center justify-center rounded-xl bg-zinc-950 px-3 md:px-6 py-2 text-xs md:text-sm font-bold text-white shadow-xl transition-all hover:bg-zinc-800 active:scale-95 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400">
                                <Plus className="mr-1.5 md:mr-2 h-4 w-4" /> New
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

            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden p-2 md:p-0 grid grid-cols-2 gap-2 md:gap-0 md:flex md:flex-row md:divide-x transition-all hover:shadow-md">
                <MetricStripItem icon={Box} label="Product Range" value={inventoryCount.toString()} color="zinc" />
                <MetricStripItem icon={AlertCircle} label="Stock Alerts" value={stockAlertsCount.toString()} color="orange" isAlert={stockAlertsCount > 0} />
                <MetricStripItem icon={IndianRupee} label="Receivables" value={formatCurrency(unpaidAmount)} color="emerald" />
                <MetricStripItem icon={TrendingUp} label="Net Profit" value={formatCurrency(metrics.profit)} color="blue" />
            </div>

            <div className="rounded-2xl border bg-card/70 shadow-sm p-4 md:p-5">
                <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                        <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">AI Business Coach</p>
                        {aiCoachLoading ? (
                            <p className="text-sm font-semibold mt-1">Preparing today's recommendation...</p>
                        ) : aiCoach ? (
                            <div className="space-y-1 mt-1">
                                <p className="text-sm font-bold">{aiCoach.headline}</p>
                                <p className="text-xs text-muted-foreground">{aiCoach.action}</p>
                                <p className="text-xs text-muted-foreground/80">{aiCoach.rationale}</p>
                            </div>
                        ) : (
                            <p className="text-sm font-semibold mt-1">No recommendation right now.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:gap-8 lg:grid-cols-12">
                <div className="lg:col-span-8 rounded-2xl md:rounded-3xl border bg-card/50 shadow-sm p-4 md:p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 md:p-8 opacity-5 transition-opacity group-hover:opacity-10">
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
                                        "px-3 md:px-4 py-1.5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
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
                                    animationDuration={2000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
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
        <div className="flex-1 flex items-center gap-3 p-3 md:p-6 lg:p-8 rounded-xl md:rounded-none border border-zinc-100/80 md:border-0 transition-all hover:bg-muted/30 group cursor-default hover-scale active-scale">
            <div className={cn("flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-xl transition-all group-hover:scale-110 shadow-sm", iconColors[color])}>
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
        <div className="flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl bg-muted/20 border border-transparent hover:border-zinc-200 dark:hover:border-white/5 transition-all group gap-3">
            <div className="space-y-1 min-w-0">
                <p className="text-sm font-bold truncate group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{title}</p>
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
        <Link href={href} className={cn("group relative flex items-center gap-3 p-4 md:p-6 rounded-2xl md:rounded-3xl border bg-card transition-all hover:shadow-xl hover:-translate-y-1", colors[color])}>
            <div className="p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-current/10 border border-current/20 shrink-0">
                <Icon className="h-5 w-5 md:h-6 md:w-6" />
            </div>
            <div className="space-y-1 min-w-0">
                <h4 className="text-lg md:text-xl font-black uppercase tracking-tight text-zinc-950 dark:text-white group-hover:text-current transition-colors">{title}</h4>
                <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">{sub}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground/50 group-hover:text-current transition-colors ml-auto shrink-0" />
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
        <DropdownMenuItem asChild className="rounded-xl p-3 focus:bg-muted cursor-pointer border-none transition-all active:scale-95">
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
