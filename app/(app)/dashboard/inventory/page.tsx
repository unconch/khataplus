import { getInventory } from "@/lib/data/inventory"
import { getSystemSettings } from "@/lib/data/organizations"
import { getProfile } from "@/lib/data/profiles"
import { getCurrentOrgId } from "@/lib/data/auth"
import type { InventoryItem } from "@/lib/types"
import { Package, AlertCircle, ArrowUpRight, Loader2 } from "lucide-react"
import { Suspense } from "react"
import { cn } from "@/lib/utils"
import { InventoryBrowser } from "@/components/inventory-browser"
import Link from "next/link"

export default function InventoryPage() {
    return (
        <div className="min-h-full space-y-6 md:space-y-10 pb-20 pt-2">
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
    const { getSystemSettings, getOrganization } = await import("@/lib/data/organizations")
    const { getProfile } = await import("@/lib/data/profiles")
    const user = await getCurrentUser()

    if (!user) return null

    const { userId, isGuest } = user
    const orgId = isGuest ? "demo-org" : await getCurrentOrgId(userId)
    if (!orgId) return null

    const [inventory, settings, profile, org] = await Promise.all([
        getInventory(orgId),
        getSystemSettings(orgId),
        userId ? getProfile(userId) : null,
        getOrganization(orgId),
    ])

    const canAdd = profile?.role === "main admin" ||
        profile?.role === "owner" ||
        (profile?.role === "staff" && settings.allow_staff_add_inventory)

    const totalStockValue = inventory.reduce((acc, item) => acc + (item.stock * item.buy_price), 0)
    const lowStockCount = inventory.filter((i: any) => {
        const threshold = Number.isFinite(Number(i.min_stock)) ? Number(i.min_stock) : 5
        return Number(i.stock || 0) <= Math.max(1, threshold)
    }).length
    const daysSinceCreated = org?.created_at ? Math.floor((Date.now() - new Date(org.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0
    const isKeepPlan = String(org?.plan_type || "free").toLowerCase() === "free"
    const showInventoryNudge = isKeepPlan && daysSinceCreated >= 30

    return (
        <div className="space-y-5 md:space-y-8">
            {showInventoryNudge && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 md:px-5 md:py-4">
                    <p className="text-sm font-semibold text-blue-900">
                        You&apos;ve added {inventory.length} products.
                    </p>
                    <p className="mt-1 text-sm text-blue-800">
                        Unlock unlimited stock tracking on Starter.
                    </p>
                    <Link
                        href="/pricing?highlight=starter&from=inventory-nudge"
                        className="mt-3 inline-flex h-9 items-center rounded-lg bg-blue-600 px-3 text-xs font-black uppercase tracking-wide text-white hover:bg-blue-500"
                    >
                        See Plans -&gt;
                    </Link>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div className="bg-white dark:bg-zinc-900/50 p-4 md:p-6 rounded-xl md:rounded-2xl border border-zinc-100 dark:border-white/5 shadow-sm flex items-center gap-3 md:gap-4">
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Package className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Total SKUs</p>
                        <p className="text-xl md:text-2xl font-bold tracking-tight tabular-nums">{inventory.length}</p>
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
                    <div className="min-w-0">
                        <p className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Low Stock</p>
                        <p className={cn("text-xl md:text-2xl font-bold tracking-tight tabular-nums", lowStockCount > 0 && "text-orange-600 dark:text-orange-400")}>{lowStockCount}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900/50 p-4 md:p-6 rounded-xl md:rounded-2xl border border-zinc-100 dark:border-white/5 shadow-sm flex items-center gap-3 md:gap-4">
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <ArrowUpRight className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Stock Value</p>
                        <p className="text-xl md:text-2xl font-bold tracking-tight tabular-nums">
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
