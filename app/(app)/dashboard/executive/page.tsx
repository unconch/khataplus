import { redirect } from "next/navigation"
import { getExecutiveAnalytics } from "@/lib/data/analytics"
import { getProfile } from "@/lib/data/profiles"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ExecutiveCharts } from "@/components/executive-charts"
import { StaffLeaderboard } from "@/components/staff-leaderboard"
import { InventoryStats } from "@/components/inventory-stats"
import { TrendingUp, Users, Package, DollarSign } from "lucide-react"

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

    return (
        <div className="p-4 space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">Executive Dashboard</h1>
                <p className="text-muted-foreground">High-level insights and performance trends</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{data.dailyTrends.reduce((acc: number, curr: any) => acc + curr.revenue, 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">+12.5% from last month</p>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">₹{data.dailyTrends.reduce((acc: number, curr: any) => acc + curr.profit, 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Avg. 18.2% margin</p>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
                        <Package className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{data.inventoryStats.totalValue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">{data.inventoryStats.totalSkus} Active SKUs</p>
                    </CardContent>
                </Card>
                <Card className="glass-card">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.staffPerformance.length} Staff members</div>
                        <p className="text-xs text-muted-foreground">Top: {data.staffPerformance[0]?.name || "N/A"}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-7">
                <Card className="lg:col-span-4 glass-card">
                    <CardHeader>
                        <CardTitle>Revenue & Profit Trends</CardTitle>
                        <CardDescription>30-day performance visualization</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ExecutiveCharts data={data.dailyTrends} />
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3 glass-card">
                    <CardHeader>
                        <CardTitle>Staff Performance</CardTitle>
                        <CardDescription>Revenue contribution by user</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <StaffLeaderboard data={data.staffPerformance} />
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <InventoryStats data={data.inventoryStats} />
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle>Top Selling Items</CardTitle>
                        <CardDescription>Revenue distribution by product</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Component for pie chart or list */}
                        <div className="space-y-4">
                            {data.itemDistribution.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-semibold text-muted-foreground w-4">{idx + 1}</span>
                                        <span className="text-sm font-medium">{item.name}</span>
                                    </div>
                                    <span className="text-sm font-bold">₹{item.value.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
