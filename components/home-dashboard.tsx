"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
    ShoppingCart,
    Users,
    Receipt,
    Box,
    Store,
    BarChart3,
    Settings,
    UserCircle,
    TrendingUp,
    Plus,
    Search,
    Bell,
    IndianRupee,
    ArrowRight,
    Loader2,
    Play,
    Sparkles,
    Shield,
    User,
    LogOut,
    ChevronRight,
    Calendar
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { Profile, SystemSettings, DailyReport, InventoryItem } from "@/lib/types"
import { SearchDialog } from "@/components/search-dialog"
import { QuickStartGuide } from "@/components/quick-start-guide"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import { setupDemoOrganization } from "@/lib/demo-data"
import { LowStockWidget } from "@/components/low-stock-widget"
import { ReferralCard } from "@/components/referral-card"
import { ImportWizard } from "@/components/import-wizard"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Download } from "lucide-react"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    Cell,
    PieChart,
    Pie
} from "recharts"

interface HomeDashboardProps {
    profile: Profile
    settings: SystemSettings
    onboardingStats: {
        hasInventory: boolean
        hasCustomers: boolean
        hasSales: boolean
        isProfileComplete: boolean
    }
    reports: DailyReport[]
    unpaidAmount: number
    inventoryHealth: number
    lowStockItems: InventoryItem[]
}

const mockSalesData = [
    { name: "Mon", sales: 4000 },
    { name: "Tue", sales: 3000 },
    { name: "Wed", sales: 2000 },
    { name: "Thu", sales: 2780 },
    { name: "Fri", sales: 1890 },
    { name: "Sat", sales: 2390 },
    { name: "Sun", sales: 3490 },
]

const recentActivities = [
    { id: 1, type: "sale", title: "New Invoice #1024", time: "10 mins ago", amount: "₹1,240", status: "completed" },
    { id: 2, type: "customer", title: "New Customer: John Doe", time: "25 mins ago", amount: null, status: "new" },
    { id: 3, type: "inventory", title: "Stock Warning: Dairy Milk", time: "1 hour ago", amount: "5 left", status: "warning" },
    { id: 4, type: "payment", title: "Payment Received: #982", time: "2 hours ago", amount: "₹500", status: "success" },
]

export function HomeDashboard({ profile, settings, onboardingStats, reports, unpaidAmount, inventoryHealth, lowStockItems }: HomeDashboardProps) {
    const [isMounted, setIsMounted] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)
    const [isEnteringDemo, setIsEnteringDemo] = useState(false)
    const [user, setUser] = useState<SupabaseUser | null>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
        }
        getUser()
    }, [supabase])

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const handleEnterDemo = async () => {
        setIsEnteringDemo(true)
        try {
            const res = await setupDemoOrganization(profile.id)
            if (res.success) {
                toast.success("Welcome to Demo Mode!")
                window.location.reload()
            }
        } catch (e: any) {
            toast.error(e.message || "Failed to enter demo")
        } finally {
            setIsEnteringDemo(false)
        }
    }

    const firstName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "User"
    const displayName = profile?.name || user?.user_metadata?.full_name || "User"

    // Prepare Chart Data from Reports
    const chartData = reports
        .slice()
        .reverse()
        .slice(-14) // Last 14 days for more density
        .map(r => ({
            date: new Date(r.report_date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
            Revenue: r.total_sale_gross,
            Profit: r.total_sale_gross - r.total_cost - r.expenses
        }))

    const lastReport = reports[0] || {
        total_sale_gross: 0,
        total_cost: 0,
        cash_sale: 0,
        online_sale: 0,
        expenses: 0
    }
    const paymentSplit = [
        { name: 'Cash', value: lastReport.cash_sale ?? 0 },
        { name: 'Online', value: lastReport.online_sale ?? 0 }
    ]
    const PIE_COLORS = ["#10B981", "#3B82F6"]
    const gradientId = isMounted ? "perfPulse" : "perfPulse-hidden"

    return (
        <div className="min-h-full bg-transparent pb-32 lg:pb-12 pt-4 lg:pt-0">
            <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />

            {/* 2a. Mobile-Only Compact Welcome (New) */}
            <div className="lg:hidden px-4 mb-4">
                <div className="bg-emerald-600 dark:bg-emerald-900 text-white p-5 rounded-[2rem] shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                        <Sparkles size={80} className="fill-white" />
                    </div>
                    <div className="relative z-10 space-y-1">
                        <p className="text-emerald-100/80 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Command Center</p>
                        <h1 className="text-xl font-black italic tracking-tighter">Hello, {firstName}</h1>
                        <div className="flex items-center gap-2 pt-1">
                            <div className="px-2 py-0.5 bg-white/10 rounded-full border border-white/10 flex items-center gap-1.5">
                                <Calendar size={10} className="text-emerald-200" />
                                <span className="text-[9px] font-bold text-white/90">{new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Desktop Dynamic Hero Header */}
            <div className="hidden lg:block bg-emerald-600 dark:bg-emerald-900 text-white p-12 rounded-[3.5rem] shadow-2xl relative z-0 mb-8 overflow-hidden group">
                <div className="absolute top-0 right-0 p-20 opacity-10 transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-12">
                    <Sparkles size={180} className="fill-white" />
                </div>

                <div className="max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center">
                                <Store className="text-emerald-600" size={20} />
                            </div>
                            <h1 className="text-3xl lg:text-5xl font-black tracking-tight leading-none italic">
                                Dashboard
                            </h1>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="h-10 rounded-xl gap-2 font-black text-[10px] uppercase tracking-widest border-2 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/5 transition-all"
                                    >
                                        <Download className="h-4 w-4" />
                                        Import Data
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl p-0 bg-transparent border-none">
                                    <ImportWizard />
                                </DialogContent>
                            </Dialog>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <p className="text-white text-xl lg:text-2xl font-bold">
                                    Hello, {firstName}
                                </p>
                            </div>
                            <p className="text-emerald-100/70 text-sm font-semibold tracking-wider uppercase">
                                Welcome back to your command center
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            variant="secondary"
                            size="lg"
                            className="rounded-2xl h-14 px-8 font-black text-emerald-700 bg-white hover:bg-emerald-50 shadow-xl transition-all hover:scale-105 active:scale-95 hidden md:flex"
                            onClick={() => setSearchOpen(true)}
                        >
                            <Search className="mr-3 h-5 w-5" />
                            Command Search
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-2xl h-14 w-14 text-white bg-secondary/10 hover:bg-secondary/20 relative"
                                >
                                    <Bell size={24} />
                                    <span className="absolute top-4 right-4 h-2 w-2 bg-red-500 rounded-full border border-emerald-600" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-80 p-0 rounded-2xl overflow-hidden glass-sheet border-border/50">
                                <div className="flex items-center border-b border-border/50 bg-muted/30">
                                    <div className="flex-1 px-4 py-3 font-bold text-sm border-b-2 border-primary text-primary">Alerts</div>
                                    <div className="flex-1 px-4 py-3 font-bold text-sm text-muted-foreground hover:bg-muted/50 cursor-pointer transition-colors">Updates</div>
                                </div>
                                <div className="p-8 text-center text-muted-foreground text-sm min-h-[200px] flex flex-col items-center justify-center gap-2">
                                    <Bell className="h-8 w-8 opacity-20" />
                                    <p>No new alerts</p>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            <div className="max-w-md lg:max-w-none mx-auto lg:mx-0 px-4 lg:px-0 relative z-10 space-y-4 lg:space-y-12">

                <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-16 gap-8 lg:gap-12 lg:items-start">

                    {/* Left/Main Column - Analytics Cockpit */}
                    <div className="lg:col-span-8 xl:col-span-11 flex flex-col gap-8 lg:gap-12">

                        {/* 1. Key Metrics - Mobile Priority Pulse (Reordered) */}
                        <div className="order-1 lg:order-2 space-y-4">
                            <div className="flex items-center justify-between px-4 lg:px-0">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Live Pulse</h3>
                                {/* Removed "Full Report" button as requested */}
                            </div>
                            <div className="flex lg:grid lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-8 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-none snap-x px-4 lg:px-0">
                                <MetricCard
                                    title="Today's Performance"
                                    value={`₹ ${(lastReport.total_sale_gross ?? 0).toLocaleString()}`}
                                    trend="+12.5%"
                                    trendUp={true}
                                    icon={TrendingUp}
                                    color="emerald"
                                    className="min-w-[170px] lg:min-w-0 snap-center"
                                />
                                <MetricCard
                                    title="Unpaid Accounts"
                                    value={`₹ ${unpaidAmount.toLocaleString()}`}
                                    trend={unpaidAmount > 10000 ? "High Risk" : "Stable"}
                                    trendUp={unpaidAmount < 5000}
                                    icon={Receipt}
                                    color="amber"
                                    className="min-w-[170px] lg:min-w-0 snap-center"
                                />
                                <MetricCard
                                    title="Inventory Health"
                                    value={`${inventoryHealth}%`}
                                    trend={inventoryHealth > 80 ? "Optimal" : "Restock Needed"}
                                    trendUp={inventoryHealth > 80}
                                    icon={Box}
                                    color="blue"
                                    className="min-w-[170px] lg:min-w-0 snap-center"
                                />
                                <MetricCard
                                    title="Gross Margin"
                                    value={`${(lastReport.total_sale_gross ?? 0) > 0 ? Math.round((((lastReport.total_sale_gross ?? 0) - (lastReport.total_cost ?? 0)) / (lastReport.total_sale_gross ?? 1)) * 100) : 0}%`}
                                    trend="Top 5%"
                                    trendUp={true}
                                    icon={Sparkles}
                                    color="emerald"
                                    className="min-w-[170px] lg:min-w-0 snap-center"
                                />
                            </div>
                        </div>

                        {/* 2. Main Performance Charts */}
                        <div className="order-2 lg:order-1 grid grid-cols-1 xl:grid-cols-3 gap-8 px-4 lg:px-0">
                            {/* Revenue & Profit Area Chart */}
                            <div className="xl:col-span-2 bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 lg:p-12 shadow-sm lg:shadow-2xl border border-border/40 relative overflow-hidden group/analytics min-h-[300px] flex flex-col">
                                <div className="flex items-center justify-between mb-8 lg:mb-10">
                                    <div className="space-y-1">
                                        <h2 className="text-xl lg:text-3xl font-black tracking-tighter italic">Performance Pulse</h2>
                                        <p className="text-muted-foreground font-bold uppercase tracking-widest text-[9px] lg:text-[10px]">Revenue vs Profit (14 Days)</p>
                                    </div>
                                    <div className="hidden lg:block h-1 w-20 bg-emerald-500 rounded-full" />
                                </div>

                                <div className="w-full mt-4 flex flex-col items-center justify-center min-h-[350px] overflow-hidden">
                                    {isMounted ? (
                                        <ResponsiveContainer width="100%" height={350}>
                                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id={`${gradientId}-revenue`} x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                                    </linearGradient>
                                                    <linearGradient id={`${gradientId}-profit`} x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" vertical={false} />
                                                <XAxis
                                                    dataKey="date"
                                                    stroke="currentColor"
                                                    className="text-muted-foreground/40 font-bold"
                                                    fontSize={10}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tick={{ dy: 10 }}
                                                />
                                                <YAxis
                                                    stroke="currentColor"
                                                    className="text-muted-foreground/40 font-bold"
                                                    fontSize={10}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickFormatter={(v) => `₹${v.toLocaleString()}`}
                                                />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: 'rgba(var(--background), 0.9)', backdropFilter: 'blur(16px)', borderRadius: "24px", border: "1px solid rgba(var(--border), 0.2)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}
                                                    labelStyle={{ color: 'var(--foreground)', fontWeight: 'bold' }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="Revenue"
                                                    stroke="#10B981"
                                                    strokeWidth={3}
                                                    fillOpacity={0.2}
                                                    fill="#10B981"
                                                    animationDuration={2000}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="Profit"
                                                    stroke="#3B82F6"
                                                    strokeWidth={3}
                                                    fillOpacity={0.2}
                                                    fill="#3B82F6"
                                                    animationDuration={2000}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded-[2.5rem]">
                                            <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Liquidity Split Pie Chart */}
                            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 lg:p-12 shadow-sm lg:shadow-2xl border border-border/40 flex flex-col items-center justify-between group/liquidity min-h-[300px]">
                                <div className="text-center space-y-1 mb-4 lg:mb-6">
                                    <h3 className="text-lg lg:text-xl font-black tracking-tight italic">Liquidity Split</h3>
                                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-[9px]">Last Closed Report</p>
                                </div>
                                <div className="w-full flex items-center justify-center min-h-[260px] overflow-hidden">
                                    <ResponsiveContainer width="100%" height={260}>
                                        <PieChart>
                                            <Pie
                                                data={paymentSplit}
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={8}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {paymentSplit.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ borderRadius: '1.5rem', border: 'none', fontWeight: 'bold' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-2 gap-4 w-full mt-4 lg:mt-6">
                                    {paymentSplit.map((p, i) => (
                                        <div key={p.name} className="bg-zinc-50 dark:bg-zinc-800/50 p-3 lg:p-4 rounded-3xl border border-border/10 flex flex-col items-center gap-1">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{p.name}</span>
                                            </div>
                                            <span className="text-base lg:text-lg font-black italic">₹{p.value.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 3. Operational Roadmap Banner Removed */}

                    </div>

                    {/* Right/Side Column - Activity Feed */}
                    <div className="lg:col-span-4 xl:col-span-5 h-full space-y-8">

                        <LowStockWidget items={lowStockItems} />

                        <ReferralCard />

                        <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border border-border/40 rounded-[2rem] lg:rounded-[3rem] shadow-2xl overflow-hidden sticky top-32">
                            <div className="p-6 lg:p-10 border-b border-border/40 bg-zinc-50/50 dark:bg-zinc-950/20 flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="font-black text-foreground uppercase tracking-widest text-[10px] lg:text-sm">Real-time Activity</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Live Monitor</p>
                                    </div>
                                </div>
                                {/* Removed "Logs" button as requested */}
                            </div>

                            <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/50 scrollbar-none">
                                {recentActivities.map((activity, index) => (
                                    <div
                                        key={activity.id}
                                        className={cn(
                                            "flex items-start gap-4 lg:gap-6 p-5 lg:p-8 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all duration-500 group cursor-default",
                                            index > 2 && "hidden lg:flex"
                                        )}
                                    >
                                        <div className={`h-14 w-14 rounded-2xl lg:rounded-[1.25rem] flex items-center justify-center shrink-0 shadow-lg lg:shadow-none transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${activity.type === 'sale' ? 'bg-emerald-100 text-emerald-600' :
                                            activity.type === 'customer' ? 'bg-blue-100 text-blue-600' :
                                                activity.type === 'inventory' ? 'bg-amber-100 text-amber-600' : 'bg-purple-100 text-purple-600'
                                            }`}>
                                            {activity.type === 'sale' ? <IndianRupee size={24} /> :
                                                activity.type === 'customer' ? <Users size={24} /> :
                                                    activity.type === 'inventory' ? <Box size={24} /> : <Receipt size={24} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-base font-black text-foreground truncate group-hover:text-primary transition-colors tracking-tight">{activity.title}</p>
                                                <span className="text-[10px] font-black text-muted-foreground ml-3 uppercase tracking-tighter bg-muted/50 px-2 py-0.5 rounded-md">{activity.time}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className={cn(
                                                        "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter",
                                                        activity.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/10' :
                                                            activity.status === 'new' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/10' :
                                                                activity.status === 'warning' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/10' : 'bg-emerald-500/10 text-emerald-600'
                                                    )}>
                                                        {activity.status}
                                                    </span>
                                                </div>
                                                {activity.amount && (
                                                    <span className="text-lg font-black text-foreground tracking-tighter">{activity.amount}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-6 lg:p-10 bg-zinc-50/50 dark:bg-zinc-950/40 border-t border-border/40 mt-auto">
                                <Link href="/dashboard/logs" className="w-full">
                                    <Button className="w-full rounded-2xl h-12 lg:h-14 font-black text-[10px] lg:text-sm uppercase tracking-widest bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-all">
                                        View System Logs
                                    </Button>
                                </Link>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    )
}

function MetricCard({ title, value, trend, trendUp, icon: Icon, color, compact = false, className }: {
    title: string,
    value: string,
    trend: string,
    trendUp: boolean,
    icon: any,
    color: 'emerald' | 'amber' | 'blue' | 'red',
    compact?: boolean,
    className?: string
}) {
    const colors = {
        emerald: "bg-emerald-500/10 text-emerald-600",
        amber: "bg-amber-500/10 text-amber-600",
        blue: "bg-blue-500/10 text-blue-600",
        red: "bg-red-500/10 text-red-600"
    }

    return (
        <div className={cn(
            "bg-white dark:bg-zinc-900 rounded-2xl lg:rounded-[2rem] p-4 lg:p-8 shadow-sm lg:shadow-xl border border-border/40 flex flex-col justify-between h-32 lg:h-full relative overflow-hidden group transition-all duration-300 hover:shadow-2xl lg:hover:scale-[1.02]",
            className
        )}>
            {/* Background Decor */}
            <div className={cn(
                "absolute -right-4 lg:-right-8 -bottom-4 lg:-bottom-8 opacity-10 lg:opacity-[0.03] transition-transform duration-700 group-hover:scale-125 group-hover:-rotate-12",
                color === 'emerald' ? 'text-emerald-500' : color === 'amber' ? 'text-amber-500' : color === 'blue' ? 'text-blue-500' : 'text-red-500'
            )}>
                <Icon className="w-20 h-20 lg:w-40 lg:h-40" />
            </div>

            <div className="flex items-start justify-between mb-2 lg:mb-6 z-10">
                <div className={cn(
                    "rounded-lg lg:rounded-2xl flex items-center justify-center shadow-inner h-8 w-8 lg:h-12 lg:w-12",
                    colors[color]
                )}>
                    <Icon className="w-4 h-4 lg:w-6 lg:h-6" strokeWidth={2.5} />
                </div>
                {trend && (
                    <div className={cn(
                        "flex items-center gap-1 rounded-full",
                        "text-[9px] lg:text-xs font-black px-1.5 py-0.5 lg:px-3 lg:py-1",
                        trendUp ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                    )}>
                        {trendUp ? '↑' : '↓'} {trend}
                    </div>
                )}
            </div>
            <div className="z-10">
                <p className={cn(
                    "font-black text-muted-foreground/60 uppercase tracking-[0.2em]",
                    "text-[10px] lg:text-xs mb-0.5 lg:mb-2"
                )}>{title}</p>
                <p className={cn(
                    "font-black tracking-tight text-foreground",
                    "text-xl lg:italic lg:text-4xl"
                )}>{value}</p>
            </div>
        </div>
    )
}
