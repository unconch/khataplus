import { getInventory, getSystemSettings, getProfile } from "@/lib/data"
import type { InventoryItem } from "@/lib/types"
import { InventoryList } from "@/components/inventory-list"
import { session } from "@descope/nextjs-sdk/server"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, AlertCircle, ListIcon, SearchIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { AddInventoryDialog } from "@/components/add-inventory-dialog"
import { ImportDialog } from "@/components/import-dialog"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

export default function InventoryPage() {
    return (
        <div className="p-4 space-y-6 pb-24 max-w-7xl mx-auto">
            <div className="flex flex-col gap-1 animate-slide-up stagger-1">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Inventory Hub</h2>
                <p className="text-sm text-muted-foreground">Strategic management of stock and valuation</p>
            </div>

            <Suspense fallback={
                <div className="h-[400px] w-full flex items-center justify-center bg-muted/20 rounded-xl animate-pulse">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                </div>
            }>
                <InventoryContent />
            </Suspense>
        </div>
    )
}

async function InventoryContent() {
    const currSession = await session()
    const userId = (currSession as any)?.token?.sub || (currSession as any)?.user?.userId

    const { getCurrentOrgId, getInventory, getSystemSettings, getProfile } = await import("@/lib/data")
    const orgId = userId ? await getCurrentOrgId(userId) : null

    if (!orgId) return null

    const [inventory, settings, profile] = await Promise.all([
        getInventory(orgId),
        getSystemSettings(orgId),
        userId ? getProfile(userId) : null
    ])

    const canAdd = profile?.role === "main admin" ||
        profile?.role === "owner" ||
        (profile?.role === "staff" && settings.allow_staff_add_inventory)

    const totalStockValue = inventory.reduce((acc, item) => acc + (item.stock * item.buy_price), 0)
    const lowStockCount = inventory.filter((i: any) => i.stock < 10).length

    return (
        <>
            {/* Top Row: Key Metrics */}
            <Card className="bg-white dark:bg-zinc-900 border-zinc-200 shadow-sm animate-slide-up stagger-1">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-zinc-100 dark:divide-zinc-800">
                        {/* Metric 1 */}
                        <div className="flex items-center gap-4 px-4 first:pl-0">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                <Package className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Product Range</p>
                                <p className="text-3xl font-black text-foreground">{inventory.length}</p>
                            </div>
                        </div>

                        {/* Metric 2 */}
                        <div className="flex items-center gap-4 px-4">
                            <div className="h-12 w-12 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                                <AlertCircle className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Stock Alerts</p>
                                <p className="text-3xl font-black text-orange-600">{lowStockCount}</p>
                            </div>
                        </div>

                        {/* Metric 3 */}
                        <div className="flex items-center gap-4 px-4 last:pr-0">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                                <span className="text-xl font-bold text-emerald-600">₹</span>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Inventory Value</p>
                                <p className="text-3xl font-black text-foreground">
                                    {totalStockValue >= 100000
                                        ? `₹${(totalStockValue / 100000).toFixed(2)} Lakhs`
                                        : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalStockValue)}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Main Hub */}
            <Card className="glass-card border-0 shadow-2xl overflow-hidden animate-slide-up stagger-4">
                <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <ListIcon className="h-4 w-4 text-primary" />
                            </div>
                            <CardTitle className="text-lg">Product Catalog</CardTitle>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="relative group flex-1 md:flex-none">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Filter inventory..."
                                    className="pl-9 h-9 w-full md:w-[250px] glass border-0 focus-visible:ring-1 focus-visible:ring-primary/30"
                                    disabled
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <ImportDialog type="inventory" orgId={orgId} />
                                {canAdd && (
                                    <AddInventoryDialog />
                                )}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 sm:p-6 overflow-x-auto">
                    <InventoryList items={(inventory as InventoryItem[]) || []} />
                </CardContent>
            </Card>
        </>
    )
}
