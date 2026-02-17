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
    Calendar,
    Smartphone
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { Profile, SystemSettings, DailyReport, InventoryItem, Organization, Sale, KhataTransaction, SupplierTransaction, Customer, Supplier } from "@/lib/types"
import { SearchDialog } from "@/components/search-dialog"
import { PwaInstallPrompt } from "@/components/pwa-install-prompt"
import { usePWA } from "@/components/pwa-provider"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import { setupDemoOrganization } from "@/lib/demo-data"
import { LowStockWidget } from "@/components/low-stock-widget"
import { ReferralCard } from "@/components/referral-card"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
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
import { motion, AnimatePresence } from "framer-motion"
import { ErrorBoundary } from "@/components/error-boundary"

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
    lowStockItems: InventoryItem[]
    sales: Sale[]
    khataTransactions: KhataTransaction[]
    supplierTransactions: SupplierTransaction[]
    customers: Customer[]
    suppliers: Supplier[]
}

export function HomeDashboard({
    profile,
    org,
    settings,
    onboardingStats,
    reports,
    unpaidAmount,
    toPayAmount,
    inventoryHealth,
    lowStockItems,
    sales,
    khataTransactions,
    supplierTransactions,
    customers,
    suppliers
}: HomeDashboardProps) {
    const [isMounted, setIsMounted] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)
    const [user, setUser] = useState<SupabaseUser | null>(null)
    const [dismissedTrial, setDismissedTrial] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
        }
        getUser()
        setIsMounted(true)
    }, [supabase])

    const { isOnline } = usePWA()

    const firstName = profile.name?.split(" ")[0] || user?.user_metadata?.full_name?.split(" ")[0] || "User"
    const [greeting, setGreeting] = useState("Hello")

    useEffect(() => {
        const hour = new Date().getHours()
        if (hour < 12) setGreeting("Good morning")
        else if (hour < 17) setGreeting("Good afternoon")
        else setGreeting("Good evening")
    }, [])

    const lastReport = reports[0] || {
        total_sale_gross: 0,
        total_cost: 0,
        cash_sale: 0,
        online_sale: 0,
        report_date: new Date().toISOString().split('T')[0]
    }

    // Top Selling Items (Calculated from sales)
    const topSellingItems = (() => {
        const itemMap = new Map<string, { name: string, amount: number }>()
        sales.forEach(s => {
            const existing = itemMap.get(s.inventory_id) || { name: s.inventory?.name || "Unknown Item", amount: 0 }
            itemMap.set(s.inventory_id, { ...existing, amount: existing.amount + s.total_amount })
        })
        return Array.from(itemMap.values())
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5)
    })()

    // Recent Transactions (Merged and Sorted)
    const recentMergedActivities = (() => {
        const activities: any[] = []

        // Add Sales
        sales.slice(0, 5).forEach(s => {
            activities.push({
                idx: s.id,
                type: 'sale',
                title: s.customer_name || s.inventory?.name || 'Sale',
                time: new Date(s.created_at),
                amount: `₹ ${s.total_amount.toLocaleString()}`,
                status: 'completed'
            })
        })

        // Add Khata
        khataTransactions.slice(0, 5).forEach(k => {
            activities.push({
                idx: k.id,
                type: 'payment',
                title: k.customer?.name || 'Customer Payment',
                time: new Date(k.created_at),
                amount: `₹ ${k.amount.toLocaleString()}`,
                status: k.type === 'credit' ? 'warning' : 'success'
            })
        })

        // Add Supplier
        supplierTransactions.slice(0, 5).forEach(st => {
            activities.push({
                idx: st.id,
                type: 'inventory',
                title: st.supplier?.name || 'Supplier Payment',
                time: new Date(st.created_at),
                amount: `₹ ${st.amount.toLocaleString()}`,
                status: st.type === 'purchase' ? 'warning' : 'success'
            })
        })

        return activities
            .sort((a, b) => b.time.getTime() - a.time.getTime())
            .slice(0, 8)
            .map(a => ({
                ...a,
                timeLabel: formatTimeAgo(a.time)
            }))
    })()

    function formatTimeAgo(date: Date) {
        const now = new Date()
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
        if (diffInSeconds < 60) return 'just now'
        const diffInMinutes = Math.floor(diffInSeconds / 60)
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`
        const diffInHours = Math.floor(diffInMinutes / 60)
        if (diffInHours < 24) return `${diffInHours}h ago`
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }

    // Chart preparations
    const chartData = reports
        .slice()
        .reverse()
        .slice(-30)
        .map(r => ({
            date: new Date(r.report_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
            Revenue: r.total_sale_gross ?? 0,
            Profit: (r.total_sale_gross ?? 0) - (r.total_cost ?? 0) - (r.expenses ?? 0)
        }))

    const mobileChartData = chartData.slice(-7)

    const trialDaysLeft = org?.trial_ends_at
        ? Math.max(0, Math.ceil((new Date(org.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
        : 0

    const isTrial = org?.subscription_status === 'trial'

    // Robust org access — prevents crashes when org is null/undefined
    const slug = org?.slug || 'dashboard'
    const orgName = org?.name || 'My Business'

    const paymentSplit = [
        { name: 'Cash', value: lastReport.cash_sale ?? 0 },
        { name: 'Online', value: lastReport.online_sale ?? 0 }
    ]
    const PIE_COLORS = ["#10B981", "#3B82F6"]

    if (!isMounted) return null

    return (
        <div className="min-h-screen bg-transparent pb-32 lg:pb-12 pt-4 lg:pt-0 overflow-x-hidden">
            <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
            <PwaInstallPrompt />

            {/* Trial & Nudge Banners */}
            <AnimatePresence>
                {(isTrial && !dismissedTrial) && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 relative z-50"
                    >
                        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                <p className="text-[10px] lg:text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                                    {trialDaysLeft} days left in your trial — Pick a plan before read-only kicks in
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link href={`/${slug}/pricing`}>
                                    <Button size="sm" className="h-7 px-3 text-[10px] font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-600 text-white rounded-lg">
                                        Choose Plan
                                    </Button>
                                </Link>
                                <button onClick={() => setDismissedTrial(true)} className="p-1 hover:bg-amber-500/10 rounded-full transition-colors">
                                    <Plus className="rotate-45 text-amber-500" size={14} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
                {!onboardingStats.isProfileComplete && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        className="bg-blue-500/10 border-b border-blue-500/20 px-4 py-2 relative z-40"
                    >
                        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <Sparkles size={14} className="text-blue-500" />
                                <p className="text-[10px] lg:text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                                    Complete your business profile to enable professional GST invoices
                                </p>
                            </div>
                            <Link href={`/${slug}/dashboard/settings`}>
                                <Button variant="ghost" size="sm" className="h-7 px-3 text-[10px] font-black uppercase tracking-wider text-blue-500 hover:bg-blue-500/10 rounded-lg">
                                    Setup Profile <ArrowRight size={10} className="ml-1" />
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Premium Background Orbital Glows */}
            <div className="orbital-glow">
                <div className="orbital-blob orbital-blob-1 opacity-20 dark:opacity-10" />
                <div className="orbital-blob orbital-blob-2 opacity-20 dark:opacity-10" />
            </div>

            <div className="max-w-[1600px] mx-auto px-4 lg:px-8 space-y-8 lg:space-y-12 relative z-10">

                {/* 1. Immersive Command Center Header */}
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-4 lg:pt-8"
                >
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-primary/60">
                            <Sparkles size={14} className="animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">{orgName}</span>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black italic tracking-tighter text-foreground leading-tight">
                            {greeting}, <span className="text-primary">{firstName} 👋</span>
                        </h1>
                        <div className="flex items-center gap-4 text-muted-foreground">
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-muted/30 rounded-full border border-border/50">
                                <Calendar size={12} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">
                                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className={cn("h-1.5 w-1.5 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]", isOnline ? "bg-emerald-500" : "bg-zinc-400")} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">{isOnline ? "Live Sync" : "Local Only"}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="lg"
                            className="h-14 px-6 rounded-2xl premium-glass border-border/40 hover:bg-background/20 font-black tracking-tight flex gap-3 shadow-sm hover:shadow-md transition-all active:scale-95"
                            onClick={() => setSearchOpen(true)}
                        >
                            <Search size={18} />
                            <span className="hidden sm:inline">Search Command</span>
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-14 w-14 rounded-2xl premium-glass border border-border/40 hover:bg-background/20 relative"
                                >
                                    <Bell size={22} className="text-foreground/80" />
                                    <span className="absolute top-4 right-4 h-2 w-2 bg-red-500 rounded-full border-2 border-background animate-pulse" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-80 p-0 rounded-2xl premium-glass-strong border-border/50 shadow-2xl overflow-hidden mt-2">
                                <div className="p-4 border-b border-border/50 bg-muted/20">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-foreground">Real-time alerts</h4>
                                </div>
                                <div className="max-h-[300px] overflow-auto">
                                    {lowStockItems.length > 0 && (
                                        <div className="p-4 border-b border-border/50 bg-red-500/5">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Box size={14} className="text-red-500" />
                                                <span className="text-[10px] font-black uppercase text-red-500">Low Stock Alert</span>
                                            </div>
                                            <p className="text-xs font-bold text-muted-foreground">
                                                {lowStockItems.length} items are running low. Reorder soon!
                                            </p>
                                        </div>
                                    )}
                                    <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-4">
                                        <Bell size={24} className="opacity-10" />
                                        <p className="font-bold opacity-30 uppercase tracking-widest text-[10px]">No new notifications</p>
                                    </div>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </motion.header>

                {/* 2. Quick Actions (Desktop Grid, Mobile Scroll) */}
                <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/50 px-2 lg:px-0">Quick Operations</h3>
                    <div className="flex lg:grid lg:grid-cols-4 gap-4 overflow-x-auto pb-2 lg:pb-0 scrollbar-none snap-x lg:snap-none">
                        <QuickAction
                            title="New Sale"
                            description="Record Daily Income"
                            icon={Plus}
                            href={`/${slug}/dashboard/sales/new`}
                            color="emerald"
                        />
                        <QuickAction
                            title="New Invoice"
                            description="Generate Billing"
                            icon={Receipt}
                            href={`/${slug}/dashboard/sales/new`}
                            color="blue"
                        />
                        <QuickAction
                            title="Add Stock"
                            description="Update Inventory"
                            icon={Box}
                            href={`/${slug}/dashboard/inventory`}
                            color="amber"
                        />
                        <QuickAction
                            title="Add Customer"
                            description="Expand Ledger"
                            icon={Users}
                            href={`/${slug}/dashboard/customers`}
                            color="purple"
                        />
                    </div>
                </div>

                {/* 3. Metrics & Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
                    <MetricCard
                        title="Today's Sales"
                        subtitle={`${new Date(lastReport.report_date).toLocaleDateString()}`}
                        value={`₹ ${(lastReport.total_sale_gross ?? 0).toLocaleString()}`}
                        trend="+12% vs yday"
                        trendUp={true}
                        icon={TrendingUp}
                        color="emerald"
                    />
                    <MetricCard
                        title="To Collect"
                        subtitle="Outstanding Dues"
                        value={`₹ ${unpaidAmount.toLocaleString()}`}
                        trend={`${customers.filter(c => (c.balance || 0) > 0).length} customers`}
                        trendUp={unpaidAmount < 10000}
                        icon={Users}
                        color="blue"
                    />
                    <MetricCard
                        title="To Pay"
                        subtitle="Supplier Dues"
                        value={`₹ ${toPayAmount.toLocaleString()}`}
                        trend={`${suppliers.filter(s => (s.balance || 0) > 0).length} suppliers`}
                        trendUp={toPayAmount < 5000}
                        icon={ShoppingCart}
                        color="amber"
                    />
                    <MetricCard
                        title="Low Stock"
                        subtitle="Items needing attention"
                        value={lowStockItems.length === 0 ? "All Stocked" : `${lowStockItems.length} Items`}
                        trend={lowStockItems.length === 0 ? "Optimal" : "Need reorder"}
                        trendUp={lowStockItems.length === 0}
                        icon={Box}
                        color={lowStockItems.length === 0 ? "emerald" : "red"}
                    />
                </div>

                {/* 4. Main Activity & Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

                    {/* Revenue Chart Section */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="lg:col-span-8 premium-glass rounded-[2.5rem] p-6 lg:p-10 flex flex-col gap-8 shadow-2xl relative overflow-hidden group border-border/30"
                    >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
                            <div className="space-y-1">
                                <h3 className="text-xl font-black italic tracking-tight text-foreground">Revenue — Last {isOnline ? '30' : '7'} Days</h3>
                                <div className="flex items-center gap-4">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                        ₹ {(chartData.reduce((acc, curr) => acc + curr.Revenue, 0) / 100000).toFixed(1)}L this period
                                    </p>
                                    <div className="flex items-center gap-1.5">
                                        <TrendingUp size={10} className="text-emerald-500" />
                                        <span className="text-[10px] font-black text-emerald-500 tracking-widest">+14%</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 bg-background/20 p-2 rounded-xl border border-border/20">
                                <LegendItem color="#10B981" label="Revenue" />
                                <LegendItem color="#3B82F6" label="Profit" />
                            </div>
                        </div>

                        <div className="h-[300px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(var(--foreground), 0.05)" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 800, fill: 'currentColor', opacity: 0.4 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 800, fill: 'currentColor', opacity: 0.4 }}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(var(--foreground), 0.05)' }} />
                                    <Bar dataKey="Revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Profit" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Recent Transactions Side Panel */}
                    <div className="lg:col-span-4 flex flex-col gap-6 lg:gap-8">
                        <div className="premium-glass rounded-[2.5rem] flex flex-col h-full min-h-[500px] shadow-2xl overflow-hidden border-border/30">
                            <div className="p-8 border-b border-border/20 flex items-center justify-between bg-muted/10">
                                <div className="space-y-1">
                                    <h3 className="font-black text-foreground uppercase tracking-[0.2em] text-xs">Recent Transactions</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[8px] font-black uppercase text-muted-foreground">Live operations</span>
                                    </div>
                                </div>
                                <span className="p-2 border border-border/50 rounded-lg bg-background/40">
                                    <Receipt size={14} className="text-primary/60" />
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-none">
                                {recentMergedActivities.length > 0 ? (
                                    recentMergedActivities.map((activity, i) => (
                                        <motion.div
                                            key={activity.idx}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.05 * i }}
                                            className="flex items-start gap-4 p-4 rounded-2xl hover:bg-background/40 transition-colors group cursor-default border border-transparent hover:border-border/20"
                                        >
                                            <div className={cn(
                                                "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105",
                                                activity.type === 'sale' ? 'bg-emerald-500/10 text-emerald-500' :
                                                    activity.type === 'customer' || activity.type === 'payment' ? 'bg-blue-500/10 text-blue-500' :
                                                        activity.type === 'inventory' ? 'bg-amber-500/10 text-amber-500' : 'bg-purple-500/10 text-purple-500'
                                            )}>
                                                {activity.type === 'sale' ? <IndianRupee size={18} /> :
                                                    activity.type === 'payment' ? <Users size={18} /> :
                                                        activity.type === 'inventory' ? <Box size={18} /> : <Receipt size={18} />}
                                            </div>
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <div className="flex justify-between items-baseline">
                                                    <p className="font-black text-sm tracking-tight truncate pr-2">{activity.title}</p>
                                                    <span className="text-[9px] font-black text-muted-foreground/40 whitespace-nowrap uppercase">{activity.timeLabel}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className={cn(
                                                        "text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter border",
                                                        activity.status === 'completed' || activity.status === 'success' ? 'border-emerald-500/20 text-emerald-500' :
                                                            'border-amber-500/20 text-amber-500'
                                                    )}>
                                                        {activity.type}
                                                    </span>
                                                    {activity.amount && (
                                                        <span className="text-sm font-black italic tracking-tighter">{activity.amount}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center p-12 text-center text-muted-foreground space-y-4">
                                        <div className="h-12 w-12 rounded-full bg-muted/20 flex items-center justify-center">
                                            <Search size={24} className="opacity-20" />
                                        </div>
                                        <p className="text-xs font-bold uppercase tracking-widest opacity-30">Your transactions will appear here</p>
                                    </div>
                                )}
                            </div>

                            <Link href={`/${slug}/dashboard/sales`} className="p-4 pt-0">
                                <Button variant="ghost" className="w-full h-12 rounded-xl font-black text-primary uppercase tracking-widest text-[9px] group">
                                    View all transactions
                                    <ArrowRight size={12} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* 5. Bottom Insights: Top Items, Liquidity & Alerts */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">

                    {/* Top Selling Items */}
                    <div className="premium-glass p-8 rounded-[2.5rem] border-border/30 shadow-xl space-y-6">
                        <div className="space-y-1">
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Top Selling Items</h4>
                            <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">Performance this month</p>
                        </div>
                        <div className="space-y-4">
                            {topSellingItems.length > 0 ? topSellingItems.map((item, i) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-black text-muted-foreground/30 w-4">{i + 1}.</span>
                                        <span className="text-sm font-black tracking-tight group-hover:text-primary transition-colors truncate max-w-[120px]">{item.name}</span>
                                    </div>
                                    <span className="text-sm font-black italic tracking-tighter">₹ {item.amount.toLocaleString()}</span>
                                </div>
                            )) : (
                                <p className="text-[10px] font-bold text-muted-foreground/40 text-center py-4 italic">No sales tracked yet</p>
                            )}
                        </div>
                    </div>

                    {/* Liquidity Split (Revenue by channel) */}
                    <div className="premium-glass p-8 rounded-[2.5rem] border-border/30 shadow-xl space-y-4">
                        <div className="space-y-1">
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">Liquidity Split</h4>
                            <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">Revenue by Channel</p>
                        </div>
                        <div className="h-32 w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={paymentSplit}
                                        innerRadius={35}
                                        outerRadius={50}
                                        paddingAngle={8}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {paymentSplit.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomPieTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <p className="text-[10px] font-black italic tracking-tighter leading-none">TOTAL</p>
                                <p className="text-xs font-black italic tracking-tighter text-emerald-500">₹ {(lastReport.total_sale_gross || 0).toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="flex justify-between items-center px-2">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Cash</span>
                                </div>
                                <p className="text-xs font-black pl-4">₹ {(lastReport.cash_sale || 0).toLocaleString()}</p>
                            </div>
                            <div className="flex flex-col gap-1 items-end">
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Online</span>
                                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                                </div>
                                <p className="text-xs font-black pr-4">₹ {(lastReport.online_sale || 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Inventory Health Widget */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="premium-glass p-8 rounded-[2.5rem] flex flex-col justify-between group cursor-pointer shadow-lg border-border/30"
                    >
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h4 className="text-xl font-black italic tracking-tighter text-foreground">Inventory Health</h4>
                                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Stock Optimization</p>
                            </div>
                            <div className="h-12 w-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                                <Box size={20} />
                            </div>
                        </div>

                        <div className="space-y-2 mt-8">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                <span className="text-muted-foreground/60 font-bold">Status</span>
                                <span className="text-emerald-500">{inventoryHealth}% Optimal</span>
                            </div>
                            <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden border border-border/50">
                                <div
                                    className="h-full bg-emerald-500 transition-all duration-1000 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                                    style={{ width: `${inventoryHealth}%` }}
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Low Stock Alert Section */}
                    <div className={cn(
                        "p-8 rounded-[2.5rem] border transition-all duration-500",
                        lowStockItems.length > 0
                            ? "bg-red-500/5 border-red-500/20 shadow-xl"
                            : "premium-glass border-border/30 opacity-50"
                    )}>
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-red-500 flex items-center gap-2">
                                <Bell size={14} />
                                Low Stock Alert
                            </h4>
                            {lowStockItems.length > 0 && <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />}
                        </div>

                        {lowStockItems.length > 0 ? (
                            <div className="space-y-3">
                                {lowStockItems.slice(0, 3).map((item, i) => (
                                    <div key={i} className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-muted-foreground">{item.name}</span>
                                        <span className="font-black text-red-500">{item.stock} left</span>
                                    </div>
                                ))}
                                <Link href={`/${slug}/dashboard/inventory`}>
                                    <Button variant="ghost" size="sm" className="w-full mt-4 h-9 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10">
                                        Reorder Now <ArrowRight size={12} className="ml-2" />
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-4 space-y-2">
                                <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                                    <Box size={14} />
                                </div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-40">All items well stocked</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    )
}

function QuickAction({ title, description, icon: Icon, href, color }: { title: string, description: string, icon: any, href: string, color: 'emerald' | 'blue' | 'amber' | 'purple' }) {
    const variants = {
        emerald: "bg-emerald-500/10 text-emerald-500 shadow-emerald-500/10 border-emerald-500/5 hover:bg-emerald-500/20",
        blue: "bg-blue-500/10 text-blue-500 shadow-blue-500/10 border-blue-500/5 hover:bg-blue-500/20",
        amber: "bg-amber-500/10 text-amber-500 shadow-amber-500/10 border-amber-500/5 hover:bg-amber-500/20",
        purple: "bg-purple-500/10 text-purple-500 shadow-purple-500/10 border-purple-500/5 hover:bg-purple-500/20"
    }

    return (
        <Link href={href} className="flex-1 min-w-[160px]">
            <motion.div
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                    "p-6 rounded-[2.5rem] border premium-glass flex flex-col gap-4 group transition-all duration-300",
                    variants[color]
                )}
            >
                <div className={cn(
                    "h-12 w-12 rounded-[1.25rem] flex items-center justify-center bg-white dark:bg-zinc-950 shadow-lg group-hover:rotate-6 transition-transform",
                    color === 'emerald' ? 'text-emerald-500' : color === 'blue' ? 'text-blue-500' : color === 'amber' ? 'text-amber-500' : 'text-purple-500'
                )}>
                    <Icon size={24} strokeWidth={2.5} />
                </div>
                <div className="space-y-0.5">
                    <p className="font-black text-foreground group-hover:text-primary transition-colors tracking-tight text-base leading-none">{title}</p>
                    <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">{description}</p>
                </div>
            </motion.div>
        </Link>
    )
}

function MetricCard({ title, subtitle, value, trend, trendUp, icon: Icon, color }: {
    title: string,
    subtitle: string,
    value: string,
    trend: string,
    trendUp: boolean,
    icon: any,
    color: 'emerald' | 'amber' | 'blue' | 'red'
}) {
    const colors = {
        emerald: "text-emerald-500 bg-emerald-500/10",
        amber: "text-amber-500 bg-amber-500/10",
        blue: "text-blue-500 bg-blue-500/10",
        red: "text-red-500 bg-red-500/10"
    }

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="premium-glass p-8 rounded-[2.5rem] shadow-xl border-border/40 relative overflow-hidden group h-full"
        >
            <div className={cn("absolute -right-4 -bottom-4 opacity-5 transition-transform duration-700 group-hover:scale-125 group-hover:-rotate-12", colors[color].split(' ')[0])}>
                <Icon size={120} />
            </div>

            <div className="flex items-start justify-between mb-8 relative z-10">
                <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner", colors[color])}>
                    <Icon size={24} strokeWidth={2.5} />
                </div>
                {trend && (
                    <div className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        trendUp ? "bg-emerald-500/10 text-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.1)]" : "bg-red-500/10 text-red-500"
                    )}>
                        {trendUp ? '↑' : '↓'} {trend}
                    </div>
                )}
            </div>

            <div className="space-y-2 relative z-10">
                <div className="space-y-0.5">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{title}</p>
                    <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">{subtitle}</p>
                </div>
                <p className="text-4xl font-black italic tracking-tighter text-foreground leading-none">{value}</p>
            </div>
        </motion.div>
    )
}

function LegendItem({ color, label }: { color: string, label: string }) {
    return (
        <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
        </div>
    )
}

function CustomTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length) {
        return (
            <div className="premium-glass-strong p-4 rounded-2xl border border-border/50 shadow-2xl">
                <p className="text-[10px] font-black uppercase tracking-widest mb-2 border-b border-border/50 pb-2">{label}</p>
                <div className="space-y-1.5">
                    {payload.map((p: any, i: any) => (
                        <div key={i} className="flex items-center justify-between gap-6">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{p.name}</span>
                            <span className="text-sm font-black italic tracking-tighter">₹{p.value.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </div>
        )
    }
    return null
}

function CustomPieTooltip({ active, payload }: any) {
    if (active && payload && payload.length) {
        return (
            <div className="premium-glass-strong p-3 rounded-xl border border-border/50 shadow-2xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary leading-none mb-1">{payload[0].name}</p>
                <p className="text-base font-black italic tracking-tighter leading-none">₹{payload[0].value.toLocaleString()}</p>
            </div>
        )
    }
    return null
}
