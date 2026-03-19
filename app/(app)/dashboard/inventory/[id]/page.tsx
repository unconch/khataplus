import Link from "next/link"
import { Suspense } from "react"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, Package, AlertCircle, TrendingUp, CalendarDays } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { getInventoryItem } from "@/lib/data/inventory"

type SaleRow = {
    id: string
    quantity: number
    total_amount: string | number
    created_at: string
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { getCurrentUser, getCurrentOrgId } = await import("@/lib/data/auth")
    const { getInventoryItem } = await import("@/lib/data/inventory")
    const user = await getCurrentUser()

    if (!user) return { title: "Inventory Asset" }
    const orgId = user.isGuest ? "demo-org" : await getCurrentOrgId(user.userId)
    if (!orgId) return { title: "Inventory Asset" }

    const item = await getInventoryItem(id, orgId)
    return { title: item ? `${item.name} | Inventory` : "Inventory Asset" }
}

export default async function InventoryAssetPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    return (
        <div className="min-h-full space-y-6 pb-20">
            <Suspense fallback={<div className="h-64 w-full rounded-3xl border bg-card animate-pulse" />}>
                <InventoryAssetContent itemId={id} />
            </Suspense>
        </div>
    )
}

async function InventoryAssetContent({ itemId }: { itemId: string }) {
    const { getCurrentUser, getCurrentOrgId } = await import("@/lib/data/auth")
    const { getDemoSql, getProductionSql } = await import("@/lib/db")
    const user = await getCurrentUser()

    if (!user) {
        redirect("/auth/login")
        return null
    }

    const orgId = user.isGuest ? "demo-org" : await getCurrentOrgId(user.userId)
    if (!orgId) {
        redirect("/setup-organization")
        return null
    }

    const item = await getInventoryItem(itemId, orgId)
    if (!item) {
        notFound()
    }

    const db = user.isGuest ? getDemoSql() : getProductionSql()
    const [salesRows, summaryRows] = await Promise.all([
        db`
            SELECT id, quantity, total_amount, created_at
            FROM sales
            WHERE org_id = ${orgId} AND inventory_id = ${itemId}
            ORDER BY created_at DESC
            LIMIT 20
        `,
        db`
            SELECT
                COALESCE(SUM(quantity), 0)::int AS qty_sold,
                COALESCE(SUM(total_amount), 0)::numeric AS gross_sales,
                COUNT(*)::int AS txn_count
            FROM sales
            WHERE org_id = ${orgId} AND inventory_id = ${itemId}
        `
    ])

    const summary = summaryRows[0] || { qty_sold: 0, gross_sales: 0, txn_count: 0 }
    const isLowStock = item.stock > 0 && item.stock < (item.min_stock || 5)
    const isOutOfStock = item.stock <= 0

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div className="space-y-2">
                    <Link href="/dashboard/inventory" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Inventory
                    </Link>
                    <h1 className="text-3xl font-black tracking-tight">{item.name || item.sku || "Inventory Asset"}</h1>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider">
                        {item.sku || "N/A SKU"} {item.hsn_code ? `- HSN ${item.hsn_code}` : ""}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard icon={Package} label="Current Stock" value={`${item.stock} units`} tone={isOutOfStock ? "danger" : isLowStock ? "warn" : "ok"} />
                <MetricCard icon={TrendingUp} label="Total Units Sold" value={String(summary.qty_sold || 0)} />
                <MetricCard icon={CalendarDays} label="Sales Transactions" value={String(summary.txn_count || 0)} />
                <MetricCard icon={AlertCircle} label="Gross Sales" value={`INR ${Number(summary.gross_sales || 0).toLocaleString()}`} />
            </div>

            <div className="rounded-2xl border bg-card shadow-sm p-6 space-y-4">
                <h2 className="text-lg font-bold tracking-tight">Recent Sales</h2>
                {salesRows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No sales recorded for this SKU yet.</p>
                ) : (
                    <div className="space-y-3">
                        {(salesRows as SaleRow[]).map((sale) => (
                            <div key={sale.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border p-3">
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold">
                                        Qty {sale.quantity}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(sale.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <p className="text-sm font-black tracking-tight">
                                    INR {Number(sale.total_amount || 0).toLocaleString()}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function MetricCard({
    icon: Icon,
    label,
    value,
    tone = "default",
}: {
    icon: LucideIcon
    label: string
    value: string
    tone?: "default" | "ok" | "warn" | "danger"
}) {
    const toneClass =
        tone === "ok"
            ? "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30"
            : tone === "warn"
                ? "text-orange-600 bg-orange-100 dark:bg-orange-900/30"
                : tone === "danger"
                    ? "text-rose-600 bg-rose-100 dark:bg-rose-900/30"
                    : "text-zinc-600 bg-zinc-100 dark:bg-zinc-800"

    return (
        <div className="rounded-2xl border bg-card p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${toneClass}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
                <p className="text-lg font-black tracking-tight">{value}</p>
            </div>
        </div>
    )
}
