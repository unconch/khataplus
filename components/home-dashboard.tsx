"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
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
    Shield
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Profile, SystemSettings } from "@/lib/types"
import { SearchDialog } from "@/components/search-dialog"
import { QuickStartGuide } from "@/components/quick-start-guide"
import { setupDemoOrganization } from "@/lib/demo-data"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
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

export function HomeDashboard({ profile, settings, onboardingStats }: HomeDashboardProps) {
    const [searchOpen, setSearchOpen] = useState(false)
    const [isEnteringDemo, setIsEnteringDemo] = useState(false)
    const router = useRouter()

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

    const isAdmin = profile.role === "main admin" || profile.role === "owner"
    const hasFullAccess = isAdmin
    const isStaff = profile.role === "staff"

    const allServices = [
        { href: "/home/sales", label: "Sales", icon: ShoppingCart, color: "#10B981", show: hasFullAccess || (isStaff && settings.allow_staff_sales) },
        { href: "/home/customers", label: "Customers", icon: Users, color: "#3B82F6", show: hasFullAccess },
        { href: "/home/khata", label: "Khata", icon: Receipt, color: "#F59E0B", show: hasFullAccess },
        { href: "/home/inventory", label: "Inventory", icon: Box, color: "#8B5CF6", show: hasFullAccess || (isStaff && settings.allow_staff_inventory) },
        { href: "/home/suppliers", label: "Suppliers", icon: Store, color: "#EC4899", show: hasFullAccess },
        { href: "/home/reports", label: "Reports", icon: BarChart3, color: "#0EA5E9", show: hasFullAccess || (isStaff && settings.allow_staff_reports) },
        { href: "/home/analytics", label: "Analytics", icon: TrendingUp, color: "#6366F1", show: hasFullAccess || (isStaff && settings.allow_staff_analytics) },
        { href: "/home/settings", label: "Settings", icon: Settings, color: "#71717A", show: true },
        { href: "/home/profile", label: "Profile", icon: UserCircle, color: "#64748B", show: true },
    ]

    const visibleServices = allServices.filter(s => s.show)
    const firstName = profile.name?.split(" ")[0] || "User"

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-zinc-950 pb-20">
            <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />

            {/* Header & Sticky Actions */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-border/40 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                            <span className="bg-emerald-500 w-2 h-8 rounded-full" />
                            Dashboard
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            className="hidden md:flex rounded-full gap-2 border-border/50"
                            onClick={() => setSearchOpen(true)}
                        >
                            <Search size={16} />
                            Search command...
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full h-9 w-9 md:hidden"
                            onClick={() => setSearchOpen(true)}
                        >
                            <Search size={16} />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full h-9 w-9"
                        >
                            <Bell size={16} />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Hero Greeting */}
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <h2 className="text-3xl font-black tracking-tight text-foreground">
                        Welcome back, {firstName}
                    </h2>
                    <p className="text-muted-foreground font-medium mt-1">
                        Here's what's happening with your business today.
                    </p>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                        title="Today's Sales"
                        value="₹ 0"
                        trend="+12%"
                        trendUp={true}
                        icon={TrendingUp}
                        color="emerald"
                    />
                    <MetricCard
                        title="Pending Dues"
                        value="₹ 0"
                        trend="-5%"
                        trendUp={false}
                        icon={Receipt}
                        color="amber"
                    />
                    <MetricCard
                        title="New Customers"
                        value="0"
                        trend="+3"
                        trendUp={true}
                        icon={Users}
                        color="blue"
                    />
                    <MetricCard
                        title="Low Stock"
                        value="0"
                        trend="Alert"
                        trendUp={false}
                        icon={Box}
                        color="red"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Chart Area */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Featured Sales Chart */}
                        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 shadow-sm border border-border/40 overflow-hidden relative">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-lg font-bold">Sales Overview</h3>
                                    <p className="text-sm text-muted-foreground">Weekly revenue performance</p>
                                </div>
                                <Button variant="ghost" size="sm" className="text-xs font-bold text-primary">
                                    View Report <ArrowRight className="ml-1 h-3 w-3" />
                                </Button>
                            </div>

                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={mockSalesData}>
                                        <defs>
                                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94A3B8', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis hide />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '16px',
                                                border: 'none',
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="sales"
                                            stroke="#10B981"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorSales)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Bento Quick Links */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="font-black text-lg">Cockpit Services</h3>
                                <Link href="/home/settings" className="text-xs font-bold text-muted-foreground hover:text-primary">Manage</Link>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {visibleServices.slice(0, 6).map((service) => (
                                    <Link
                                        key={service.href}
                                        href={service.href}
                                        className="group bg-white dark:bg-zinc-900 border border-border/40 rounded-3xl p-6 transition-all hover:shadow-lg hover:-translate-y-1 active:scale-95 flex flex-col items-center justify-center text-center gap-3"
                                    >
                                        <div
                                            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-110"
                                            style={{ backgroundColor: `${service.color}10` }}
                                        >
                                            <service.icon size={24} style={{ color: service.color }} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm">{service.label}</h4>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Area */}
                    <div className="space-y-8">
                        {/* Demo/Onboarding Block */}
                        {!onboardingStats.hasSales && profile.role !== 'staff' && (
                            <div className="bg-zinc-900 border border-border/40 rounded-[2rem] p-8 text-white relative overflow-hidden group shadow-2xl">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <Sparkles size={120} className="text-emerald-500 animate-pulse" />
                                </div>
                                <h3 className="text-xl font-black mb-2 relative z-10">Live Demo</h3>
                                <p className="text-white/60 text-sm mb-6 relative z-10 font-medium">Test-drive KhataPlus with pre-filled business data.</p>
                                <Button
                                    onClick={handleEnterDemo}
                                    disabled={isEnteringDemo}
                                    className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-bold relative z-10"
                                >
                                    {isEnteringDemo ? <Loader2 className="h-5 w-5 animate-spin" /> : "Start Tour"}
                                </Button>
                            </div>
                        )}

                        {profile.role !== 'staff' && (onboardingStats.hasSales || onboardingStats.hasInventory || onboardingStats.hasCustomers) && !onboardingStats.isProfileComplete && (
                            <div className="bg-white dark:bg-zinc-900 border border-border/40 rounded-[2rem] p-6 shadow-sm">
                                <QuickStartGuide
                                    orgId={profile.organization_id || ""}
                                    stats={onboardingStats}
                                />
                            </div>
                        )}

                        {/* Recent Activity */}
                        <div className="bg-white dark:bg-zinc-900 border border-border/40 rounded-[2rem] p-8 shadow-sm">
                            <h3 className="font-black text-lg mb-6">Recent Activity</h3>
                            <div className="space-y-6">
                                {recentActivities.map((activity) => (
                                    <div key={activity.id} className="flex items-start gap-4 group cursor-pointer">
                                        <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${activity.status === 'success' ? 'bg-emerald-500' :
                                            activity.status === 'warning' ? 'bg-red-500' : 'bg-primary'
                                            }`} />
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-bold group-hover:text-primary transition-colors">{activity.title}</p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">{activity.time}</span>
                                                {activity.amount && (
                                                    <span className="text-xs font-black text-foreground">{activity.amount}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Button variant="ghost" className="w-full mt-6 rounded-2xl text-xs font-bold text-muted-foreground hover:text-primary border border-dashed border-border/60">
                                View Full Audit Log
                            </Button>
                        </div>

                        {/* System Status / Support */}
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-[2rem] p-6">
                            <div className="flex items-center gap-3 mb-2 text-emerald-600">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-black uppercase tracking-widest">System Operational</span>
                            </div>
                            <p className="text-xs text-muted-foreground font-medium">Need help? WhatsApp support is active.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function MetricCard({ title, value, trend, trendUp, icon: Icon, color }: {
    title: string,
    value: string,
    trend: string,
    trendUp: boolean,
    icon: any,
    color: 'emerald' | 'amber' | 'blue' | 'red'
}) {
    const colors = {
        emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-500/10",
        amber: "bg-amber-500/10 text-amber-600 border-amber-500/10",
        blue: "bg-blue-500/10 text-blue-600 border-blue-500/10",
        red: "bg-red-500/10 text-red-600 border-red-500/10"
    }

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 shadow-sm border border-border/40 hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-4">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${colors[color]}`}>
                    <Icon size={24} />
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                    }`}>
                    {trend}
                </div>
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{title}</p>
            <p className="text-3xl font-black tracking-tighter">{value}</p>
        </div>
    )
}

