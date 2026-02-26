import { getInventory } from "@/lib/data/inventory"
import { getSystemSettings } from "@/lib/data/organizations"
import { getProfile } from "@/lib/data/profiles"
import { getCurrentOrgId } from "@/lib/data/auth"
import type { InventoryItem } from "@/lib/types"
import { Package, AlertCircle, ArrowUpRight, Loader2 } from "lucide-react"
import { Suspense } from "react"
import { cn } from "@/lib/utils"
import { InventoryBrowser } from "@/components/inventory-browser"

export default function InventoryPage() {
    return (
        <div className="min-h-full space-y-6 md:space-y-10 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8 pt-2 md:pt-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-5xl">
                        Inventory
                    </h1>
                    <p className="text-sm font-medium text-muted-foreground">Manage your products and inventory levels</p>
                </div>
            </div>

            <Suspense fallback={
                <div className="h-[600px] w-full flex items-center justify-center bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-3xl animate-pulse border border-zinc-100 dark:border-white/5">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground/20" />
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Loading Catalog</p>
                    </div>
                </div>
            }>
                <InventoryContent />
            </Suspense>
        </div>
    )
}

async function InventoryContent() {
    const { getCurrentUser, getCurrentOrgId } = await import("@/lib/data/auth")
    const { getInventory } = await import("@/lib/data/inventory")
    const { getSystemSettings } = await import("@/lib/data/organizations")
    const { getProfile } = await import("@/lib/data/profiles")
    const user = await getCurrentUser()

    if (!user) return null

    const { userId, isGuest } = user
    const orgId = isGuest ? "demo-org" : await getCurrentOrgId(userId)
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
        <div className="space-y-5 md:space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div className="bg-white dark:bg-zinc-900/50 p-4 md:p-6 rounded-xl md:rounded-2xl border border-zinc-100 dark:border-white/5 shadow-sm flex items-center gap-3 md:gap-4">
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Package className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <div>
                        <p className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Total SKUs</p>
                        <p className="text-xl md:text-2xl font-bold tracking-tight">{inventory.length}</p>
                    </div>
                </div>

                <div className={cn(
                    "p-4 md:p-6 rounded-xl md:rounded-2xl border shadow-sm flex items-center gap-3 md:gap-4",
                    lowStockCount > 0
                        ? "bg-orange-50/50 dark:bg-orange-500/5 border-orange-100 dark:border-orange-500/20"
                        : "bg-white dark:bg-zinc-900/50 border-zinc-100 dark:border-white/5"
                )}>
                    <div className={cn(
                        "h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center",
                        lowStockCount > 0 ? "bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                    )}>
                        <AlertCircle className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <div>
                        <p className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Low Stock</p>
                        <p className={cn("text-xl md:text-2xl font-bold tracking-tight", lowStockCount > 0 && "text-orange-600 dark:text-orange-400")}>{lowStockCount}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900/50 p-4 md:p-6 rounded-xl md:rounded-2xl border border-zinc-100 dark:border-white/5 shadow-sm flex items-center gap-3 md:gap-4">
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <ArrowUpRight className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <div>
                        <p className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Stock Value</p>
                        <p className="text-xl md:text-2xl font-bold tracking-tight">
                            {"\u20B9"}{totalStockValue >= 100000 ? `${(totalStockValue / 100000).toFixed(2)} L` : totalStockValue.toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900/40 rounded-2xl md:rounded-3xl border border-zinc-100 dark:border-white/5 p-4 md:p-8 shadow-sm">
                <InventoryBrowser
                    items={(inventory as InventoryItem[]) || []}
                    orgId={orgId}
                    canAdd={Boolean(canAdd)}
                />
            </div>
        </div>
    )
}
