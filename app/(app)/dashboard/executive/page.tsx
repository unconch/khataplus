import { redirect } from "next/navigation"
import { getExecutiveAnalytics } from "@/lib/data/analytics"
import { getProfile } from "@/lib/data/profiles"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ExecutiveCharts } from "@/components/executive-charts"
import { StaffLeaderboard } from "@/components/staff-leaderboard"
import { InventoryStats } from "@/components/inventory-stats"
import { TrendingUp, Users, Package, DollarSign } from "lucide-react"
import { StockHealthTable } from "@/components/analytics/StockHealthTable"
import { ReorderList } from "@/components/analytics/ReorderList"
import { PlainEnglishInsights } from "@/components/analytics/PlainEnglishInsights"

export default async function ExecutiveDashboard() {
    const { getCurrentUser } = await import("@/lib/data/auth")
    const { getProfile } = await import("@/lib/data/profiles")
    const { getExecutiveAnalytics } = await import("@/lib/data/analytics")
    const user = await getCurrentUser()

    if (!user) {
        redirect("/auth/login")
        return null
    }
    const { userId, isGuest } = user

    const profile = isGuest ? { role: "owner" } : await getProfile(userId)

    // Only Owner and Main Admin can see this (Guest is mapped to admin role in mock)
    if (profile?.role !== "owner" && profile?.role !== "main admin" && profile?.role !== "admin") {
        redirect("/dashboard")
        return null
    }

    const { getCurrentOrgId } = await import("@/lib/data/auth")
    const orgId = await getCurrentOrgId(userId)
    if (!orgId) {
        redirect("/dashboard")
        return null
    }

    const data = await getExecutiveAnalytics(orgId)

    // AI Stock Integration (V1 - Pure Math)
    const { getStockHealth, getReorderSuggestions, getStockInsights } = await import("@/lib/analytics/ai-stock")
    const [stockHealth, reorderSuggestions, stockInsights] = await Promise.all([
        getStockHealth(orgId),
        getReorderSuggestions(orgId),
        getStockInsights(orgId)
    ])

    return (
        <div className="p-4 space-y-10">
            <div className="flex flex-col gap-1 px-2">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-black tracking-tighter italic">Executive Dashboard</h1>
                    <div className="px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-black rounded uppercase tracking-widest mt-1">PRO</div>
                </div>
                <p className="text-muted-foreground font-medium text-sm">Real-time performance metrics & AI stock predictions</p>
            </div>

            {/* AI Stock Insights Layer */}
            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <PlainEnglishInsights insights={stockInsights} />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="glass-card bg-white/50 dark:bg-zinc-900/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Monthly Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black tracking-tighter italic">₹{data.dailyTrends.reduce((acc: number, curr: any) => acc + curr.revenue, 0).toLocaleString()}</div>
                        <p className="text-[10px] font-bold text-emerald-600 mt-1 uppercase tracking-tight">+12.5% vs Prior</p>
                    </CardContent>
                </Card>
                <Card className="glass-card bg-white/50 dark:bg-zinc-900/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Profit</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black tracking-tighter italic text-emerald-600 dark:text-emerald-400">₹{data.dailyTrends.reduce((acc: number, curr: any) => acc + curr.profit, 0).toLocaleString()}</div>
                        <p className="text-[10px] font-bold text-zinc-500 mt-1 uppercase tracking-tight">Avg 18.2% Margin</p>
                    </CardContent>
                </Card>
                <Card className="glass-card bg-white/50 dark:bg-zinc-900/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Stock Value</CardTitle>
                        <Package className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black tracking-tighter italic">₹{data.inventoryStats.totalValue.toLocaleString()}</div>
                        <p className="text-[10px] font-bold text-orange-600 mt-1 uppercase tracking-tight">{data.inventoryStats.totalSkus} Active SKUs</p>
                    </CardContent>
                </Card>
                <Card className="glass-card bg-white/50 dark:bg-zinc-900/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Efficiency</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black tracking-tighter italic">{data.staffPerformance.length} Seats</div>
                        <p className="text-[10px] font-bold text-blue-600 mt-1 uppercase tracking-tight">Top: {data.staffPerformance[0]?.name || "N/A"}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-8 lg:grid-cols-7">
                <Card className="lg:col-span-4 glass-card bg-white/40 dark:bg-zinc-900/40">
                    <CardHeader className="pb-8">
                        <CardTitle className="text-xl font-black tracking-tight italic">Financial Pulse</CardTitle>
                        <CardDescription className="text-[10px] font-black uppercase tracking-widest">30-day performance trailing average</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        <ExecutiveCharts data={data.dailyTrends} />
                    </CardContent>
                </Card>

                <div className="lg:col-span-3 space-y-8">
                    <StockHealthTable data={stockHealth} />
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                <ReorderList data={reorderSuggestions} />
                <InventoryStats data={data.inventoryStats} />
                <Card className="glass-card bg-white/40 dark:bg-zinc-900/40">
                    <CardHeader>
                        <CardTitle className="text-xl font-black tracking-tight italic">Top Selling Items</CardTitle>
                        <CardDescription className="text-[10px] font-black uppercase tracking-widest">Revenue distribution by SKU</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-5">
                            {data.itemDistribution.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black text-xs group-hover:bg-primary/10 transition-colors">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{item.name}</p>
                                            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1 rounded-full mt-2 overflow-hidden">
                                                <div
                                                    className="bg-primary h-full rounded-full transition-all duration-1000"
                                                    style={{ width: `${Math.min(100, (item.value / data.dailyTrends.reduce((a: number, b: any) => a + b.revenue, 0)) * 100 * 5)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-base font-black tracking-tighter italic">₹{item.value.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
