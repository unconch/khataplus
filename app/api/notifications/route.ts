import { NextResponse } from "next/server"
import { requireOrgContext } from "@/lib/server/org-context"
import { sql } from "@/lib/db"
import { getSystemAlerts } from "@/lib/monitoring"

type NotificationItem = {
  id: string
  kind: "warning" | "info" | "success" | "security"
  title: string
  message: string
  href?: string
  timestamp: string
}

export async function GET() {
  try {
    const ctx = await requireOrgContext()
    if (ctx instanceof NextResponse) return ctx

    if (ctx.isGuest) return NextResponse.json({ notifications: [] })

    const { orgId } = ctx
    const now = new Date().toISOString()
    const notifications: NotificationItem[] = []

    const lowStockRows = await sql`
      SELECT COUNT(*)::int AS count
      FROM inventory
      WHERE org_id = ${orgId}
        AND stock <= COALESCE(min_stock, 5)
    `
    const lowStockCount = Number(lowStockRows?.[0]?.count || 0)
    if (lowStockCount > 0) {
      notifications.push({
        id: `low-stock-${orgId}-${lowStockCount}`,
        kind: "warning",
        title: "Low Stock Alert",
        message: `${lowStockCount} item${lowStockCount > 1 ? "s are" : " is"} below threshold.`,
        href: "/dashboard/inventory",
        timestamp: now,
      })
    }

    const pendingCreditRows = await sql`
      SELECT
        COUNT(*)::int AS pending_count,
        COALESCE(SUM(total_amount), 0)::numeric AS pending_amount
      FROM sales
      WHERE org_id = ${orgId}
        AND payment_method = 'Credit'
        AND COALESCE(payment_status, 'pending') = 'pending'
    `
    const pendingCount = Number(pendingCreditRows?.[0]?.pending_count || 0)
    const pendingAmount = Number(pendingCreditRows?.[0]?.pending_amount || 0)
    if (pendingCount > 0) {
      notifications.push({
        id: `pending-credit-${orgId}-${pendingCount}-${Math.round(pendingAmount)}`,
        kind: "info",
        title: "Pending Credit",
        message: `${pendingCount} credit sale${pendingCount > 1 ? "s" : ""} pending (\u20B9${Math.round(pendingAmount).toLocaleString("en-IN")}).`,
        href: "/dashboard/sales",
        timestamp: now,
      })
    }

    const todaySalesRows = await sql`
      SELECT COUNT(*)::int AS count
      FROM sales
      WHERE org_id = ${orgId}
        AND sale_date = CURRENT_DATE
    `
    if (Number(todaySalesRows?.[0]?.count || 0) === 0) {
      notifications.push({
        id: `no-sales-today-${orgId}`,
        kind: "info",
        title: "No Sales Recorded Today",
        message: "Record your first sale to keep reports and cashflow tracking current.",
        href: "/dashboard/sales?action=new",
        timestamp: now,
      })
    }

    const alerts = await getSystemAlerts()
    for (const alert of alerts.slice(0, 3)) {
      notifications.push({
        id: `alert-${String(alert.id)}`,
        kind: alert.type === "fraud" || alert.type === "access" ? "security" : "warning",
        title: alert.type === "fraud" || alert.type === "access" ? "Security Alert" : "System Alert",
        message: String(alert.message || "System detected an anomaly."),
        href: "/dashboard/admin",
        timestamp: new Date(alert.timestamp || now).toISOString(),
      })
    }

    notifications.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
    return NextResponse.json({ notifications: notifications.slice(0, 20) })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to load notifications" }, { status: 500 })
  }
}
